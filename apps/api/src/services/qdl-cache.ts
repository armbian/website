import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import type { FastifyBaseLogger } from 'fastify';

/**
 * QDL firehose loaders and UFS provisioning descriptors published by Armbian in
 * the qcombin repository. The API caches them so the imager fetches from a
 * single trusted host (integrity-checked via SHA-256) instead of hammering
 * GitHub raw, which rate-limits anonymous traffic at 60 req/h.
 */
const QCOMBIN_BASE = 'https://raw.githubusercontent.com/armbian/qcombin/main/';

// Same family-relative allowlist enforced by QdlMetaSchema: no traversal, no
// leading slash, no scheme. relPath never leaves this host after validation.
const SAFE_REL = /^(?!.*\.\.)[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

const FETCH_TIMEOUT_MS = 20_000;
const MAX_BLOB_BYTES = 8 * 1024 * 1024;

export type QdlAssetKind = 'loader' | 'provision';

export interface QdlAssetRef {
  /** Family-rooted path, e.g. `Kodiak/prog_firehose_ddr.elf`. */
  relPath: string;
  kind: QdlAssetKind;
}

interface BlobMeta {
  etag: string | null;
  lastModified: string | null;
}

export class QdlAssetCache {
  private cacheDir: string;

  constructor(
    cacheDir: string,
    private log: FastifyBaseLogger,
  ) {
    this.cacheDir = join(cacheDir, 'qdl');
  }

  /** Fetch, validate and hash each referenced asset. Returns relPath → SHA-256 hex. */
  async warm(refs: QdlAssetRef[]): Promise<Map<string, string>> {
    const digests = new Map<string, string>();
    await Promise.all(
      refs.map(async (ref) => {
        try {
          const buffer = await this.ensure(ref.relPath, ref.kind, true);
          digests.set(ref.relPath, sha256(buffer));
        } catch (err) {
          this.log.warn(
            { relPath: ref.relPath, err: (err as Error).message },
            'QDL asset warm failed — served without digest',
          );
        }
      }),
    );
    return digests;
  }

  /** Serve a cached blob, fetching from qcombin on miss. Null if invalid or unavailable. */
  async getBlob(relPath: string): Promise<{ data: Buffer; contentType: string } | null> {
    if (!SAFE_REL.test(relPath)) return null;
    const kind: QdlAssetKind = relPath.endsWith('.elf') ? 'loader' : 'provision';
    try {
      const data = await this.ensure(relPath, kind, false);
      return {
        data,
        contentType: kind === 'loader' ? 'application/octet-stream' : 'application/xml',
      };
    } catch {
      return null;
    }
  }

  /**
   * Return the on-disk blob, fetching from upstream when absent. When
   * `revalidate` is set (sync path), a cached copy is checked against qcombin
   * with a conditional GET so an updated asset re-downloads and its digest
   * changes; on 304, upstream error, or network failure the cached copy is
   * kept. Request-path reads (`revalidate=false`) serve the cached copy
   * directly and only hit the network on a miss.
   */
  private async ensure(relPath: string, kind: QdlAssetKind, revalidate: boolean): Promise<Buffer> {
    if (!SAFE_REL.test(relPath)) throw new Error('invalid relPath');
    const filePath = join(this.cacheDir, relPath);

    let cached: Buffer | null = null;
    try {
      const buf = await readFile(filePath);
      validateBlob(buf, kind);
      cached = buf;
    } catch {
      cached = null; // miss or corrupt on-disk copy
    }

    if (cached && !revalidate) return cached;

    const headers: Record<string, string> = {};
    if (cached) {
      const meta = await this.readMeta(filePath);
      if (meta?.etag) headers['If-None-Match'] = meta.etag;
      if (meta?.lastModified) headers['If-Modified-Since'] = meta.lastModified;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(QCOMBIN_BASE + relPath, {
        signal: controller.signal,
        redirect: 'follow',
        headers,
      });
    } catch (err) {
      if (cached) return cached; // network failure during revalidation — keep cached
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 304 && cached) return cached;
    if (!res.ok) {
      if (cached) return cached; // upstream error — keep cached
      throw new Error(`HTTP ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength > MAX_BLOB_BYTES)
      throw new Error(`blob too large (${buffer.byteLength}B)`);
    validateBlob(buffer, kind);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    await this.writeMeta(filePath, {
      etag: res.headers.get('etag'),
      lastModified: res.headers.get('last-modified'),
    });
    return buffer;
  }

  private async readMeta(filePath: string): Promise<BlobMeta | null> {
    try {
      return JSON.parse(await readFile(`${filePath}.meta`, 'utf-8')) as BlobMeta;
    } catch {
      return null;
    }
  }

  private async writeMeta(filePath: string, meta: BlobMeta): Promise<void> {
    await writeFile(`${filePath}.meta`, JSON.stringify(meta));
  }
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

/** Reject anything that is not a firehose ELF / UFS provisioning XML before caching it. */
function validateBlob(buf: Buffer, kind: QdlAssetKind): void {
  if (kind === 'loader') {
    const isElf =
      buf.length >= 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46;
    if (!isElf) throw new Error('not an ELF loader');
  } else if (!buf.includes(Buffer.from('<ufs '))) {
    throw new Error('not a UFS provisioning XML');
  }
}
