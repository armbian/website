import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

export function registerSearchRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/search?q=
   * Search boards by query string (minimum 2 characters).
   */
  server.get<{
    Querystring: { q?: string };
  }>('/api/v1/search', (request, reply) => {
    const query = request.query.q?.trim() ?? '';

    if (query.length < 2 || query.length > 200) {
      void reply.status(400);
      return {
        error: 'Bad Request',
        message: 'Search query must be between 2 and 200 characters',
        statusCode: 400,
      };
    }

    const results = server.store.search(query);

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: results,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total: results.length,
      },
    };
  });
}
