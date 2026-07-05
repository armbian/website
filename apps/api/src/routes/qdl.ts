import type { FastifyInstance } from 'fastify';
import '../types.js';

export function registerQdlRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/qdl/blob/{family}/{path...}
   * Serve a cached qcombin firehose loader or UFS provisioning descriptor,
   * proxying from upstream on first request. The imager verifies the payload
   * against the SHA-256 digest carried in the board's `qdl` block.
   */
  server.get<{ Params: { '*': string } }>('/api/v1/qdl/blob/*', async (request, reply) => {
    const blob = await server.qdlCache.getBlob(request.params['*']);

    if (!blob) {
      void reply.status(404);
      return { error: 'Not Found', statusCode: 404 };
    }

    void reply.header('Cache-Control', 'public, max-age=86400, immutable');
    void reply.type(blob.contentType);
    return reply.send(blob.data);
  });
}
