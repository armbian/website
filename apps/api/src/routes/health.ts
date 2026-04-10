import type { FastifyInstance } from 'fastify';
import type { SyncService } from '../services/sync.service.js';
import '../types.js';

export function registerHealthRoutes(server: FastifyInstance, sync: SyncService): void {
  /**
   * POST /api/v1/sync — trigger an immediate upstream sync.
   * Restricted to loopback callers; operators invoke it via `manage.sh sync`
   * which proxies through `docker exec` so the source is the container's
   * own loopback interface.
   */
  server.post('/api/v1/sync', async (request, reply) => {
    const ip = request.ip;
    const isLoopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    if (!isLoopback) {
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
