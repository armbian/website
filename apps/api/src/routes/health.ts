import type { FastifyInstance } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import type { SyncService } from '../services/sync.service.js';
import '../types.js';

const SYNC_TOKEN = process.env['SYNC_TOKEN'] ?? '';

/** Constant-time check of a `Bearer <token>` header against the configured secret. */
function bearerMatches(header: string | undefined): boolean {
  if (!SYNC_TOKEN || !header) return false;
  const match = /^Bearer\s+(.+)$/.exec(header);
  if (!match) return false;
  const provided = Buffer.from(match[1]!);
  const expected = Buffer.from(SYNC_TOKEN);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export function registerHealthRoutes(server: FastifyInstance, sync: SyncService): void {
  /**
   * POST /api/v1/sync: gated by SYNC_TOKEN bearer, or loopback for manage.sh sync.
   * Loopback is safe only because Caddy overwrites X-Forwarded-For.
   */
  server.post('/api/v1/sync', async (request, reply) => {
    const ip = request.ip;
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    if (!bearerMatches(request.headers.authorization) && !isLoopback) {
      return reply.code(403).send({ error: 'Forbidden', statusCode: 403 });
    }
    void sync.sync().catch((err) => server.log.error({ err }, 'Manual sync failed'));
    return reply.code(202).send({
      status: 'accepted',
      message: 'Sync started in background',
    });
  });

  /**
   * GET /api/v1/health
   * Health check with sync status, data counts, and source statuses.
   */
  server.get('/api/v1/health', (_request, reply) => {
    const { sourceStatuses, boardCount, imageCount, vendorCount } = server.store.metadata;

    const allOk = Object.values(sourceStatuses).every((s) => s.status === 'ok');
    const anyError = Object.values(sourceStatuses).some((s) => s.status === 'error');
    const status = anyError ? 'degraded' : allOk ? 'ok' : 'degraded';

    // Health endpoint should not be cached aggressively
    void reply.header('Cache-Control', 'no-cache');
    return {
      status,
      version: process.env['npm_package_version'] ?? '1.0.0',
      uptime: process.uptime(),
      lastSync: sync.getLastSyncTime()?.toISOString() ?? null,
      nextSync: sync.getNextSyncTime()?.toISOString() ?? null,
      counts: {
        boards: boardCount,
        images: imageCount,
        vendors: vendorCount,
      },
      sources: Object.fromEntries(
        Object.entries(sourceStatuses).map(([key, val]) => [
          key,
          {
            status: val.status,
            lastFetch: val.lastFetch?.toISOString() ?? null,
            error: val.error ?? null,
          },
        ]),
      ),
    };
  });
}
