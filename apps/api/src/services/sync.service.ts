import type { FastifyBaseLogger } from 'fastify';
import {
  RawImagesResponseSchema,
  RawPartnerSchema,
  RawMaintainerSchema,
  RawKernelDescriptionSchema,
  LegacyRedirectEntrySchema,
  BoardEnrichmentSchema,
} from '@armbian/schemas';
import type {
  RawImageAsset,
  RawPartner,
  RawMaintainer,
  RawKernelDescription,
  LegacyRedirectEntry,
  BoardEnrichment,
} from '@armbian/schemas';
import { DATA_SOURCES, ARMBIAN_URLS } from '@armbian/config';
import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Normalizer } from './normalizer.js';
import type { DataStore, ZohoFormTokens } from './datastore.js';
import type { ImageCache } from './image-cache.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CACHE_DIR = process.env['CACHE_DIR'] ?? join(DATA_DIR, '.cache');
const CADDY_SNIPPETS_DIR = process.env['CADDY_SNIPPETS_DIR'] ?? '/app/shared/caddy';
const CADDY_ADMIN_URL = process.env['CADDY_ADMIN_URL'] ?? 'http://caddy:2019';
const CADDY_FILE_PATH = process.env['CADDY_FILE_PATH'] ?? '/etc/caddy/Caddyfile';
const CADDY_RELOAD_MAX_ATTEMPTS = 10;
const CADDY_RELOAD_RETRY_DELAY_MS = 2_000;

const FETCH_TIMEOUT_MS = 15_000;

interface SourceResult<T> {
  key: string;
  data: T | null;
  error?: string;
}

export class SyncService {
  private normalizer: Normalizer;
  private interval: ReturnType<typeof setInterval> | null = null;
  private lastSyncTime: Date | null = null;
  private nextSyncTime: Date | null = null;

  // Cached last-known-good raw data (for partial failure resilience)
  private cachedImages: RawImageAsset[] = [];
  private cachedPartners: RawPartner[] = [];
  private cachedMaintainers: RawMaintainer[] = [];
  private cachedKernels: RawKernelDescription = {};

  constructor(
    private store: DataStore,
    private log: FastifyBaseLogger,
    private imageCache: ImageCache,
  ) {
    this.normalizer = new Normalizer();
  }

  /** Try to load from local disk cache — fast startup without network */
  async loadFromCache(): Promise<boolean> {
    try {
      const raw = await readFile(join(CACHE_DIR, 'upstream.json'), 'utf-8');
      const cached = JSON.parse(raw) as {
        images: RawImageAsset[];
        partners: RawPartner[];
        maintainers: RawMaintainer[];
        kernels: RawKernelDescription;
        savedAt: string;
      };

      this.cachedImages = cached.images;
      this.cachedPartners = cached.partners;
      this.cachedMaintainers = cached.maintainers;
      this.cachedKernels = cached.kernels;

      // Normalize and load
      const redirects = await this.loadLocalJson<LegacyRedirectEntry[]>(
        join(DATA_DIR, 'legacy-redirects.json'),
        z.array(LegacyRedirectEntrySchema),
      );
      const enrichments = await this.loadLocalJson<BoardEnrichment[]>(
        join(DATA_DIR, 'enrichments.json'),
        z.array(BoardEnrichmentSchema),
      );
      const normalized = this.normalizer.normalize(
        {
          images: this.cachedImages,
          partners: this.cachedPartners,
          maintainers: this.cachedMaintainers,
          kernelDescriptions: this.cachedKernels,
        },
        { redirects: redirects ?? [], enrichments: enrichments ?? [] },
      );
      this.store.load(normalized);
      this.lastSyncTime = new Date(cached.savedAt);

      this.log.info(
        { boards: this.store.getBoardCount(), savedAt: cached.savedAt },
        'Loaded from disk cache',
      );

      // Fire and forget — don't block startup on Caddy reload
      void this.writeCaddyRedirects();

      return true;
    } catch {
      return false;
    }
  }

  /** Persist current upstream data to disk */
  private async saveToCache(): Promise<void> {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      const payload = JSON.stringify({
        images: this.cachedImages,
        partners: this.cachedPartners,
        maintainers: this.cachedMaintainers,
        kernels: this.cachedKernels,
        savedAt: new Date().toISOString(),
      });
      await writeFile(join(CACHE_DIR, 'upstream.json'), payload, 'utf-8');
      this.log.info('Upstream data saved to disk cache');
    } catch (err) {
      this.log.warn({ err }, 'Failed to save disk cache');
    }
  }

  async sync(): Promise<void> {
    const start = Date.now();
    this.log.info('Starting data sync...');

    // Fetch all sources in parallel with individual error isolation
    const [imagesResult, partnersResult, maintainersResult, kernelsResult, boardConfigSlugs] =
      await Promise.all([
        this.fetchSource('images', DATA_SOURCES.IMAGES, (data) => {
          const parsed = RawImagesResponseSchema.parse(data);
          return parsed.assets;
        }),
        this.fetchSource('partners', DATA_SOURCES.PARTNERS, (data) =>
          z.array(RawPartnerSchema).parse(data),
        ),
        this.fetchSource('maintainers', DATA_SOURCES.MAINTAINERS, (data) =>
          z.array(RawMaintainerSchema).parse(data),
        ),
        this.fetchSource('kernels', DATA_SOURCES.KERNEL_DESCRIPTIONS, (data) =>
          RawKernelDescriptionSchema.parse(data),
        ),
        this.fetchBoardConfigSlugs(),
      ]);

    // Use fresh data or fall back to cached
    if (imagesResult.data) {
      this.cachedImages = imagesResult.data;
      this.store.updateSourceStatus('images', 'ok');
    } else {
      this.store.updateSourceStatus('images', 'error', imagesResult.error);
      this.log.warn({ error: imagesResult.error }, 'Using cached images data');
    }

    if (partnersResult.data) {
      this.cachedPartners = partnersResult.data;
      this.store.updateSourceStatus('partners', 'ok');
    } else {
      this.store.updateSourceStatus('partners', 'error', partnersResult.error);
    }

    if (maintainersResult.data) {
      this.cachedMaintainers = maintainersResult.data;
      this.store.updateSourceStatus('maintainers', 'ok');
    } else {
      this.store.updateSourceStatus('maintainers', 'error', maintainersResult.error);
    }

    if (kernelsResult.data) {
      this.cachedKernels = kernelsResult.data;
      this.store.updateSourceStatus('kernels', 'ok');
    } else {
      this.store.updateSourceStatus('kernels', 'error', kernelsResult.error);
    }

    // Load local data files
    const redirects = await this.loadLocalJson<LegacyRedirectEntry[]>(
      join(DATA_DIR, 'legacy-redirects.json'),
      z.array(LegacyRedirectEntrySchema),
    );

    const enrichments = await this.loadLocalJson<BoardEnrichment[]>(
      join(DATA_DIR, 'enrichments.json'),
      z.array(BoardEnrichmentSchema),
    );

    // Normalize and load into store
    const normalized = this.normalizer.normalize(
      {
        images: this.cachedImages,
        partners: this.cachedPartners,
        maintainers: this.cachedMaintainers,
        kernelDescriptions: this.cachedKernels,
      },
      {
        redirects: redirects ?? [],
        enrichments: enrichments ?? [],
        boardConfigSlugs,
      },
    );

    this.store.load(normalized);

    // Update Caddy redirects snippet after each successful sync
    void this.writeCaddyRedirects();

    // Fetch GitHub stars during sync — avoids live third-party calls at request time
    try {
      const ghRes = await fetch(ARMBIAN_URLS.GITHUB_API_REPO, {
        headers: { 'User-Agent': 'armbian-api' },
        signal: AbortSignal.timeout(10_000),
      });
      if (ghRes.ok) {
        const ghData = (await ghRes.json()) as { stargazers_count?: number };
        if (ghData.stargazers_count) {
          this.store.metadata.githubStars = ghData.stargazers_count;
        }
      }
    } catch {
      this.log.debug('GitHub stars fetch failed — keeping previous value');
    }

    // Fetch Zoho Bigin form tokens so the frontend never uses stale values.
    // Both pages live on the same origin so we hit them in parallel.
    // The update-data form does not embed a reCAPTCHA widget of its own
    // (Zoho renders it only on the contact form), so we fall back to the
    // contact form's site-key — same Google key is valid for the whole
    // armbian.com origin.
    const [contactTokens, updateDataTokens] = await Promise.all([
      this.fetchBiginTokens(ARMBIAN_URLS.BIGIN_FORM_PAGE),
      this.fetchBiginTokens(ARMBIAN_URLS.UPDATE_DATA_FORM_PAGE),
    ]);
    if (contactTokens) {
      this.store.metadata.contactFormTokens = contactTokens;
    }
    if (updateDataTokens) {
      const fallbackKey =
        updateDataTokens.recaptchaSiteKey ||
        this.store.metadata.contactFormTokens?.recaptchaSiteKey ||
        '';
      this.store.metadata.updateDataFormTokens = {
        ...updateDataTokens,
        recaptchaSiteKey: fallbackKey,
      };
    }

    if (contactTokens || updateDataTokens) {
      this.log.info(
        {
          forms: [contactTokens && 'contact', updateDataTokens && 'update-data'].filter(Boolean),
        },
        'Zoho form tokens refreshed',
      );
    }

    this.lastSyncTime = new Date();

    // Persist to disk for fast startup next time
    await this.saveToCache();

    // Revalidate board + vendor logos against the CDN using conditional
    // GETs. Runs in the background — a long CDN scan must not delay the
    // sync's visible effects (store updates, Caddy reload).
    const boardSlugs = this.store.getBoards({ sort: 'popularity' }).boards.map((b) => b.slug);
    const vendorSlugs = this.store.getVendors().map((v) => v.slug);
    void this.imageCache
      .refreshImages(boardSlugs, vendorSlugs)
      .catch((err) => this.log.warn({ err }, 'Image cache refresh failed'));

    const duration = Date.now() - start;
    this.log.info(
      {
        duration,
        boardCount: this.store.getBoardCount(),
        imageCount: this.store.getImageCount(),
      },
      'Data sync completed',
    );
  }

  startCron(intervalMs: number): void {
    this.stopCron();
    this.nextSyncTime = new Date(Date.now() + intervalMs);
    this.interval = setInterval(async () => {
      try {
        await this.sync();
        this.nextSyncTime = new Date(Date.now() + intervalMs);
      } catch (err) {
        this.log.error({ err }, 'Scheduled sync failed');
        this.nextSyncTime = new Date(Date.now() + intervalMs);
      }
    }, intervalMs);
    this.log.info({ intervalMs }, 'Sync cron started');
  }

  stopCron(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Write the legacy redirect map as a Caddy snippet imported by the reverse proxy. */
  async writeCaddyRedirects(): Promise<void> {
    const redirects = this.store.getRedirects();
    const entries = Object.entries(redirects);
    if (entries.length === 0) return;

    // Emit bare and trailing-slash variants from a deduplicated set —
    // Caddy's `map` directive rejects duplicate input keys.
    const map = new Map<string, string>();
    for (const [rawSource, target] of entries) {
      const source = rawSource.replace(/\/+$/, '');
      if (!source) continue;
      if (!map.has(source)) map.set(source, target);
      const withSlash = `${source}/`;
      if (!map.has(withSlash)) map.set(withSlash, target);
    }

    // The `route` block forces Caddy to evaluate `map` before `redir`;
    // otherwise `redir` is hoisted and the matcher sees an empty placeholder.
    const lines: string[] = [
      '# Auto-generated from API redirects map — do not edit manually',
      `# Generated at ${new Date().toISOString()}`,
      `# Entries: ${map.size}`,
      '',
      'route {',
      '\tmap {http.request.uri.path} {legacy_target} {',
    ];
    for (const [source, target] of map) {
      lines.push(`\t\t${source} ${target}`);
    }
    lines.push('\t\tdefault ""');
    lines.push('\t}');
    lines.push('\t@is_legacy not vars {legacy_target} ""');
    lines.push('\tredir @is_legacy {legacy_target} 301');
    lines.push('}');

    try {
      await mkdir(CADDY_SNIPPETS_DIR, { recursive: true });
      await writeFile(join(CADDY_SNIPPETS_DIR, 'redirects.caddy'), lines.join('\n'));
      this.log.info({ count: map.size }, 'Caddy redirects snippet written');
      await this.reloadCaddy();
    } catch (err) {
      this.log.warn({ err }, 'Failed to write Caddy redirects snippet');
    }
  }

  /**
   * Reload Caddy via its admin API so the new snippet takes effect without
   * restarting any container. Retried with fixed backoff to cover the
   * startup race before Caddy is ready; failures are non-fatal.
   */
  private async reloadCaddy(): Promise<void> {
    let caddyfile: string;
    try {
      caddyfile = await readFile(CADDY_FILE_PATH, 'utf-8');
    } catch (err) {
      this.log.debug({ err, path: CADDY_FILE_PATH }, 'Caddyfile not mounted — skipping reload');
      return;
    }

    for (let attempt = 1; attempt <= CADDY_RELOAD_MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`${CADDY_ADMIN_URL}/load`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/caddyfile',
            'Cache-Control': 'must-revalidate',
            // Caddy parses Origin as a URL, so the scheme is required.
            Origin: 'http://caddy:2019',
          },
          body: caddyfile,
          signal: AbortSignal.timeout(5_000),
        });
        if (res.ok) {
          this.log.info({ attempt }, 'Caddy config reloaded');
          return;
        }
        const body = await res.text().catch(() => '');
        this.log.debug({ attempt, status: res.status, body }, 'Caddy reload returned non-OK');
      } catch (err) {
        this.log.debug({ attempt, err: (err as Error).message }, 'Caddy admin API unreachable');
      }
      if (attempt < CADDY_RELOAD_MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, CADDY_RELOAD_RETRY_DELAY_MS));
      }
    }
    this.log.warn(
      { attempts: CADDY_RELOAD_MAX_ATTEMPTS },
      'Caddy reload failed after retries — snippet written but proxy not refreshed',
    );
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  getNextSyncTime(): Date | null {
    return this.nextSyncTime;
  }

  /**
   * Scrape a Zoho Bigin Web-to-Record form page for the four values the
   * frontend needs to replay the form submission. Returns null on network
   * failure or when the three always-present tokens are missing. The
   * reCAPTCHA site-key can legitimately be absent (update-data form); the
   * caller is responsible for falling back to a shared key in that case.
   */
  private async fetchBiginTokens(url: string): Promise<ZohoFormTokens | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return null;
      const html = await res.text();
      const xn = html.match(/name='xnQsjsdp' value='([^']+)'/)?.[1];
      const xm = html.match(/name='xmIwtLD' value='([^']+)'/)?.[1];
      const at = html.match(/name='actionType' value='([^']+)'/)?.[1];
      const rc = html.match(/data-sitekey='([^']+)'/)?.[1] ?? '';
      if (!xn || !xm || !at) return null;
      return { xnQsjsdp: xn, xmIwtLD: xm, actionType: at, recaptchaSiteKey: rc };
    } catch {
      return null;
    }
  }

  private async fetchBoardConfigSlugs(): Promise<Set<string>> {
    try {
      const res = await fetch('https://api.github.com/repos/armbian/build/contents/config/boards', {
        headers: { 'User-Agent': 'armbian-api' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return new Set();
      const files = (await res.json()) as { name: string }[];
      const slugs = new Set<string>();
      for (const f of files) {
        for (const ext of ['.conf', '.csc', '.wip', '.tvb', '.eos']) {
          if (f.name.endsWith(ext)) slugs.add(f.name.replace(ext, ''));
        }
      }
      this.log.info({ count: slugs.size }, 'Fetched board config slugs from GitHub');
      return slugs;
    } catch {
      this.log.debug('Board config slugs fetch failed — all boards will show config link');
      return new Set();
    }
  }

  private async fetchSource<T>(
    key: string,
    url: string,
    parser: (data: unknown) => T,
  ): Promise<SourceResult<T>> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return { key, data: null, error: `HTTP ${response.status}` };
      }

      const json: unknown = await response.json();
      const parsed = parser(json);
      return { key, data: parsed };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log.warn({ source: key, error: message }, 'Source fetch failed');
      return { key, data: null, error: message };
    }
  }

  private async loadLocalJson<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
    try {
      const content = await readFile(path, 'utf-8');
      const json: unknown = JSON.parse(content);
      return schema.parse(json);
    } catch {
      this.log.debug({ path }, 'Local data file not found or invalid, using empty default');
      return null;
    }
  }
}
