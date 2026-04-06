import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

export function registerRedirectRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/redirects
   * Full legacy redirect map.
   */
  server.get('/api/v1/redirects', (_request, reply) => {
    const redirects = server.store.getRedirects();

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: redirects,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
      },
    };
  });
}
