import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

export function registerPartnerRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/partners
   * List all partners.
   */
  server.get('/api/v1/partners', (_request, reply) => {
    const partners = server.store.getPartners();

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: partners,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total: partners.length,
      },
    };
  });
}
