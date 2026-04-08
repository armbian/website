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
import type { DataStore } from './datastore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');
const CACHE_DIR = process.env['CACHE_DIR'] ?? join(DATA_DIR, '.cache');

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
        { images: this.cachedImages, partners: this.cachedPartners, maintainers: this.cachedMaintainers, kernelDescriptions: this.cachedKernels },
        { redirects: redirects ?? [], enrichments: enrichments ?? [] },
      );
      this.store.load(normalized);
      this.lastSyncTime = new Date(cached.savedAt);

      this.log.info(
        { boards: this.store.getBoardCount(), savedAt: cached.savedAt },
        'Loaded from disk cache',
      );
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

    this.lastSyncTime = new Date();

    // Persist to disk for fast startup next time
    await this.saveToCache();

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

  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  getNextSyncTime(): Date | null {
    return this.nextSyncTime;
  }

  private async fetchBoardConfigSlugs(): Promise<Set<string>> {
    try {
      const res = await fetch(
        'https://api.github.com/repos/armbian/build/contents/config/boards',
        { headers: { 'User-Agent': 'armbian-api' }, signal: AbortSignal.timeout(15_000) },
      );
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

  private async loadLocalJson<T>(
    path: string,
    schema: z.ZodType<T>,
  ): Promise<T | null> {
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
