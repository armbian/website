import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { FastifyBaseLogger } from 'fastify';
import { boardImageUrl, vendorLogoUrl } from '@armbian/config';

/**
 * Run `fn` over `items` with bounded concurrency. Preserves the
 * `Promise.allSettled` result shape so callers see rejections explicitly.
 */
async function runBatched<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<Array<PromiseSettledResult<R>>> {
  const out: Array<PromiseSettledResult<R>> = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    out.push(...(await Promise.allSettled(batch.map(fn))));
  }
  return out;
}

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
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  )
    return true;
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
const STANDARD_IMAGE_SIZE = '480';
const REFRESH_CONCURRENCY = 10;

type ImageType = 'board' | 'vendor' | 'partner';

/** Partner logo entry — slug + upstream source URL from partners.json `logo_url` */
export interface PartnerLogoEntry {
  slug: string;
  sourceUrl: string;
}

interface ImageRefreshTask {
  type: ImageType;
  slug: string;
  sourceUrl?: string;
}

type CdnFetchResult =
  | { kind: 'unchanged' }
  | {
      kind: 'ok';
      buffer: Buffer;
      contentType: string;
      etag: string | null;
      lastModified: string | null;
    }
  | { kind: 'error' };

export class ImageCache {
  private cacheDir: string;
  private log: FastifyBaseLogger;
  private isRefreshing = false;

  constructor(cacheDir: string, log: FastifyBaseLogger) {
    this.cacheDir = join(cacheDir, 'images');
    this.log = log;
  }

  /** Get cached image or fetch from CDN and cache it */
  async getImage(
    type: ImageType,
    slug: string,
    size: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    if (!SAFE_SLUG_RE.test(slug) || !SAFE_SLUG_RE.test(size)) return null;
    const filePath = this.imagePath(type, slug, size);

    // Try local cache first — validate PNG magic bytes to discard corrupted entries
    try {
      const data = await readFile(filePath);
      if (data.length > 4 && data[0] === 0x89 && data[1] === 0x50) {
        return { data, contentType: 'image/png' };
      }
      // Corrupted cache entry (e.g. HTML error page) — delete and re-fetch
      await unlink(filePath).catch(() => {});
    } catch {
      // Not cached — fetch from CDN
    }

    const url = this.cdnUrlFor(type, slug, { size });
    if (!url) return null;
    const fetched = await this.fetchFromCdn(url);
    if (fetched.kind !== 'ok') return null;

    await this.persistImage(filePath, fetched.buffer, fetched.etag, fetched.lastModified);
    this.log.debug({ type, slug, size }, 'Image cached');
    return { data: fetched.buffer, contentType: fetched.contentType };
  }

  /**
   * Revalidate every cached board, vendor and partner image against its
   * upstream using conditional GETs (If-None-Match / If-Modified-Since).
   * Files the upstream reports as unchanged (304) are kept; changed files
   * (200) are rewritten on disk. Missing slugs are fetched fresh. Called
   * at the end of every sync so `./manage.sh sync` picks up upstream logo
   * updates without re-downloading the whole catalogue. Re-entrant calls
   * are skipped so a long refresh can't overlap with the next cron cycle.
   */
  async refreshImages(
    boards: string[],
    vendors: string[],
    partners: PartnerLogoEntry[] = [],
  ): Promise<void> {
    if (this.isRefreshing) {
      this.log.debug('Image cache refresh already in progress — skipping');
      return;
    }
    this.isRefreshing = true;

    try {
      const tasks: ImageRefreshTask[] = [
        ...boards.map((slug) => ({ type: 'board' as const, slug })),
        ...vendors.map((slug) => ({ type: 'vendor' as const, slug })),
        ...partners.map(({ slug, sourceUrl }) => ({ type: 'partner' as const, slug, sourceUrl })),
      ];
      const counts: Record<'unchanged' | 'updated' | 'fetched' | 'failed', number> = {
        unchanged: 0,
        updated: 0,
        fetched: 0,
        failed: 0,
      };
      const results = await runBatched(tasks, REFRESH_CONCURRENCY, (task) =>
        this.revalidateOne(task),
      );
      for (const r of results) {
        counts[r.status === 'fulfilled' ? r.value : 'failed']++;
      }
      this.log.info({ ...counts, total: tasks.length }, 'Image cache refresh complete');
    } finally {
      this.isRefreshing = false;
    }
  }

  private async revalidateOne(
    task: ImageRefreshTask,
  ): Promise<'unchanged' | 'updated' | 'fetched' | 'failed'> {
    const { type, slug, sourceUrl } = task;
    if (!SAFE_SLUG_RE.test(slug)) return 'failed';
    const url = this.cdnUrlFor(type, slug, { sourceUrl });
    if (!url) return 'failed';
    const filePath = this.imagePath(type, slug);

    const onDisk = await this.readMeta(filePath);
    const headers: Record<string, string> = {};
    if (onDisk?.etag) headers['If-None-Match'] = onDisk.etag;
    if (onDisk?.lastModified) headers['If-Modified-Since'] = onDisk.lastModified;
    const wasCached = onDisk !== null;

    const result = await this.fetchFromCdn(url, headers);
    switch (result.kind) {
      case 'unchanged':
        return 'unchanged';
      case 'ok':
        await this.persistImage(filePath, result.buffer, result.etag, result.lastModified);
        return wasCached ? 'updated' : 'fetched';
      case 'error':
        // Transient CDN error shouldn't evict a known-good cached copy.
        return wasCached ? 'unchanged' : 'failed';
    }
  }

  private imagePath(type: ImageType, slug: string, size: string = STANDARD_IMAGE_SIZE): string {
    if (type === 'partner') return join(this.cacheDir, 'partner', `${slug}.png`);
    return join(this.cacheDir, type, size, `${slug}.png`);
  }

  /**
   * Resolve the upstream URL for a cached asset.
   * - board/vendor: derived from slug + size against the Armbian CDN.
   * - partner: passed through from `partners.json` `logo_url` (variable host).
   */
  private cdnUrlFor(
    type: ImageType,
    slug: string,
    opts: { size?: string; sourceUrl?: string } = {},
  ): string | null {
    const size = opts.size ?? STANDARD_IMAGE_SIZE;
    switch (type) {
      case 'board':
        return boardImageUrl(slug, size, { cdn: true });
      case 'vendor':
        return vendorLogoUrl(slug, size, { cdn: true });
      case 'partner':
        return opts.sourceUrl ?? null;
    }
  }

  private async persistImage(
    filePath: string,
    buffer: Buffer,
    etag: string | null,
    lastModified: string | null,
  ): Promise<void> {
    // Write body before meta: a crash between the two leaves a PNG with no
    // sidecar, which only costs us one extra fetch on the next sync. The
    // reverse order would leave a sidecar pointing at stale content.
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    await this.writeMeta(filePath, etag, lastModified);
  }

  private async fetchFromCdn(
    url: string,
    headers: Record<string, string> = {},
  ): Promise<CdnFetchResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal, redirect: 'follow', headers });
      clearTimeout(timeout);
      if (res.status === 304) return { kind: 'unchanged' };
      if (!res.ok) return { kind: 'error' };

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) return { kind: 'error' };

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength === 0) return { kind: 'error' };

      return {
        kind: 'ok',
        buffer,
        contentType,
        etag: res.headers.get('etag'),
        lastModified: res.headers.get('last-modified'),
      };
    } catch (err) {
      this.log.debug({ url, err: (err as Error).message }, 'Image fetch failed');
      return { kind: 'error' };
    }
  }

  private async readMeta(
    filePath: string,
  ): Promise<{ etag: string | null; lastModified: string | null } | null> {
    try {
      const raw = await readFile(`${filePath}.meta`, 'utf-8');
      const parsed = JSON.parse(raw) as { etag?: string; lastModified?: string };
      return { etag: parsed.etag ?? null, lastModified: parsed.lastModified ?? null };
    } catch {
      return null;
    }
  }

  private async writeMeta(
    filePath: string,
    etag: string | null,
    lastModified: string | null,
  ): Promise<void> {
    if (!etag && !lastModified) return;
    const payload: Record<string, string> = {};
    if (etag) payload['etag'] = etag;
    if (lastModified) payload['lastModified'] = lastModified;
    await writeFile(`${filePath}.meta`, JSON.stringify(payload));
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

  /**
   * Serve cached partner logo (lazy fetch on cold cache).
   * Background revalidation against the upstream source is handled by
   * `refreshImages` after every sync — same conditional-GET path used for
   * board and vendor logos.
   */
  async getPartnerImage(
    slug: string,
    sourceUrl: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    if (!SAFE_SLUG_RE.test(slug)) return null;
    const filePath = this.imagePath('partner', slug);

    try {
      const data = await readFile(filePath);
      if (data.length > 4 && data[0] === 0x89 && data[1] === 0x50) {
        return { data, contentType: 'image/png' };
      }
      await unlink(filePath).catch(() => {});
    } catch {
      // Not cached
    }

    const fetched = await this.fetchFromCdn(sourceUrl);
    if (fetched.kind !== 'ok') return null;
    if (fetched.buffer.byteLength > MAX_PROXY_RESPONSE_BYTES) return null;

    await this.persistImage(filePath, fetched.buffer, fetched.etag, fetched.lastModified);
    return { data: fetched.buffer, contentType: fetched.contentType };
  }
}
