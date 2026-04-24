import type { FastifyInstance, FastifyReply } from 'fastify';
import '../types.js';
import type { ZohoFormTokens } from '../services/datastore.js';

const TOKEN_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=7200';

function sendTokens(reply: FastifyReply, tokens: ZohoFormTokens | null, missingError: string) {
  if (!tokens) {
    return reply.status(503).send({ error: missingError });
  }
  void reply.header('Cache-Control', TOKEN_CACHE_CONTROL);
  return { data: tokens };
}

export function registerContactRoutes(server: FastifyInstance): void {
  server.get('/api/v1/contact-form-tokens', (_req, reply) =>
    sendTokens(
      reply,
      server.store.metadata.contactFormTokens,
      'Contact form tokens not yet available',
    ),
  );

  server.get('/api/v1/update-data-form-tokens', (_req, reply) =>
    sendTokens(
      reply,
      server.store.metadata.updateDataFormTokens,
      'Update data form tokens not yet available',
    ),
  );
}
