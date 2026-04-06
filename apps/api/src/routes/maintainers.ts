import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

export function registerMaintainerRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/maintainers
   * List all maintainers.
   */
  server.get('/api/v1/maintainers', (_request, reply) => {
    const maintainers = server.store.getMaintainers();

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: maintainers,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total: maintainers.length,
      },
    };
  });
}
