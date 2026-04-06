import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

function sanitizeSlug(s: string): string {
  return s.replace(/[^a-z0-9-]/gi, '').slice(0, 100);
}

export function registerVendorRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/vendors
   * List all vendors.
   */
  server.get('/api/v1/vendors', (_request, reply) => {
    const vendors = server.store.getVendors();

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: vendors,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total: vendors.length,
      },
    };
  });

  /**
   * GET /api/v1/vendors/:slug
   * Single vendor detail with their boards.
   */
  server.get<{
    Params: { slug: string };
  }>('/api/v1/vendors/:slug', (request, reply) => {
    const vendor = server.store.getVendor(request.params.slug);

    if (!vendor) {
      void reply.status(404);
      return {
        error: 'Not Found',
        message: `Vendor '${sanitizeSlug(request.params.slug)}' not found`,
        statusCode: 404,
      };
    }

    const boards = server.store.getVendorBoards(request.params.slug);

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: {
        ...vendor,
        boards,
      },
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
      },
    };
  });
}
