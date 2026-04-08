import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import { boardImageUrl, vendorLogoUrl } from '@armbian/config';

/** Allowlisted hostname patterns for the image proxy */
const PROXY_ALLOWED_HOSTS = [
  /\.armbian\.com$/,
  /\.zoho\.com$/,
  /\.zohoexternal\.com$/,
  /\.zohostatic\.com$/,
  /\.githubusercontent\.com$/,
  /\.github\.com$/,
  /\.wp\.com$/,
  /\.gravatar\.com$/,
];

/** Block requests to private/internal IP ranges */
function isPrivateHost(hostname: string): boolean {
  // Block localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]') return true;
  // Block common private/cloud metadata ranges
  if (/^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(hostname)) return true;
  // Block link-local / cloud metadata
  if (hostname.startsWith('169.254.')) return true;
  // Block 0.0.0.0
  if (hostname === '0.0.0.0') return true;
  return false;
}

/** Validate a URL is safe for the image proxy to fetch */
export function validateProxyUrl(url: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL' };
  }

  // Only allow https
  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTPS URLs are allowed' };
  }

  // Block private/internal hosts
  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, reason: 'Private/internal hosts are not allowed' };
  }

  // Check hostname against allowlist
  const allowed = PROXY_ALLOWED_HOSTS.some((pattern) => pattern.test(parsed.hostname));
  if (!allowed) {
    return { valid: false, reason: `Host '${parsed.hostname}' is not in the allowlist` };
  }

  return { valid: true };
}

const FETCH_TIMEOUT_MS = 10_000;
const MAX_PROXY_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB
const SAFE_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;

export class ImageCache {
  private cacheDir: string;
  private log: FastifyBaseLogger;

  constructor(cacheDir: string, log: FastifyBaseLogger) {
    this.cacheDir = join(cacheDir, 'images');
    this.log = log;
  }

  /** Get cached image or fetch from CDN and cache it */
  async getImage(type: 'board' | 'vendor', slug: string, size: string): Promise<{ data: Buffer; contentType: string } | null> {
    if (!SAFE_SLUG_RE.test(slug) || !SAFE_SLUG_RE.test(size)) return null;
    const subDir = join(this.cacheDir, type, size);
    const filePath = join(subDir, `${slug}.png`);

    // Try local cache first
    try {
      const data = await readFile(filePath);
      return { data, contentType: 'image/png' };
    } catch {
      // Not cached — fetch from CDN
    }

    const url = type === 'board'
      ? boardImageUrl(slug, size, { cdn: true })
      : vendorLogoUrl(slug, size, { cdn: true });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      // CDN URLs are trusted — follow redirects to mirrors
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const buffer = Buffer.from(await res.arrayBuffer());

      // Save to cache
      await mkdir(subDir, { recursive: true });
      await writeFile(filePath, buffer);
      this.log.debug({ type, slug, size }, 'Image cached');

      return { data: buffer, contentType: res.headers.get('content-type') ?? 'image/png' };
    } catch (err) {
      this.log.debug({ type, slug, err: (err as Error).message }, 'Image fetch failed');
      return null;
    }
  }

  /** Fetch and cache any external URL — keyed by hash. Only allowlisted hosts. */
  async getByUrl(url: string): Promise<{ data: Buffer; contentType: string } | null> {
    const validation = validateProxyUrl(url);
    if (!validation.valid) {
      this.log.warn({ url, reason: validation.reason }, 'Image proxy URL rejected');
      return null;
    }

    const hash = createHash('md5').update(url).digest('hex');
    const ext = url.match(/\.(png|jpg|jpeg|svg|webp|gif)(\?|$)/i)?.[1] ?? 'png';
    const subDir = join(this.cacheDir, 'proxy');
    const filePath = join(subDir, `${hash}.${ext}`);

    try {
      const data = await readFile(filePath);
      return { data, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` };
    } catch {
      // Not cached
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal, redirect: 'manual' });
      clearTimeout(timeout);
      // Reject redirects to prevent SSRF via open redirect chains
      if (res.status >= 300 && res.status < 400) return null;
      if (!res.ok) return null;

      const contentLength = parseInt(res.headers.get('content-length') ?? '0', 10);
      if (contentLength > MAX_PROXY_RESPONSE_BYTES) return null;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength > MAX_PROXY_RESPONSE_BYTES) return null;

      await mkdir(subDir, { recursive: true });
      await writeFile(filePath, buffer);
      return { data: buffer, contentType: res.headers.get('content-type') ?? `image/${ext}` };
    } catch {
      return null;
    }
  }

  /** Get cached partner logo or fetch from source URL and cache it by slug */
  async getPartnerImage(slug: string, sourceUrl: string): Promise<{ data: Buffer; contentType: string } | null> {
    if (!SAFE_SLUG_RE.test(slug)) return null;
    const subDir = join(this.cacheDir, 'partner');
    const filePath = join(subDir, `${slug}.png`);

    try {
      const data = await readFile(filePath);
      return { data, contentType: 'image/png' };
    } catch {
      // Not cached
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(sourceUrl, { signal: controller.signal, redirect: 'follow' });
      clearTimeout(timeout);
      if (!res.ok) return null;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength > MAX_PROXY_RESPONSE_BYTES) return null;

      await mkdir(subDir, { recursive: true });
      await writeFile(filePath, buffer);
      return { data: buffer, contentType: res.headers.get('content-type') ?? 'image/png' };
    } catch {
      return null;
    }
  }

  /** Pre-warm cache for a list of slugs across all used sizes */
  async warmup(boards: string[], vendors: string[]): Promise<void> {
    const CONCURRENCY = 10;
    const boardSizes = ['480'];
    const vendorSizes = ['480'];

    let cached = 0;
    let fetched = 0;
    let failed = 0;

    const tasks: Array<{ type: 'board' | 'vendor'; slug: string; size: string }> = [];
    for (const size of boardSizes) {
      for (const slug of boards) tasks.push({ type: 'board', slug, size });
    }
    for (const size of vendorSizes) {
      for (const slug of vendors) tasks.push({ type: 'vendor', slug, size });
    }

    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const batch = tasks.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async ({ type, slug, size }) => {
          const filePath = join(this.cacheDir, type, size, `${slug}.png`);
          try {
            await stat(filePath);
            return 'cached' as const;
          } catch {
            const result = await this.getImage(type, slug, size);
            return result ? 'fetched' as const : 'failed' as const;
          }
        }),
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value === 'cached') cached++;
          else if (r.value === 'fetched') fetched++;
          else failed++;
        } else {
          failed++;
        }
      }
    }

    this.log.info({ cached, fetched, failed, total: tasks.length }, 'Image cache warmup complete');
  }
}
