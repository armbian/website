import type { FastifyInstance } from 'fastify';
import '../types.js';

export function registerContactRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/contact-form-tokens
   * Returns the latest Zoho Bigin form tokens fetched during sync.
   * The frontend uses these instead of hardcoded values so tokens
   * stay valid even after the form is republished on Zoho.
   */
  server.get('/api/v1/contact-form-tokens', (_request, reply) => {
    const tokens = server.store.metadata.contactFormTokens;
    if (!tokens) {
      return reply.status(503).send({ error: 'Contact form tokens not yet available' });
    }
    void reply.header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
    return { data: tokens };
  });
}
