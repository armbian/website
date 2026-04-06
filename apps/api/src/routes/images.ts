import type { FastifyInstance } from 'fastify';
import { validateProxyUrl } from '../services/image-cache.js';
import '../types.js';

export function registerImageRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/images/boards/:size/:slug.png
   * Serve cached board image — proxies from CDN on first request.
   */
  server.get<{ Params: { size: string; slug: string } }>(
    '/api/v1/images/boards/:size/:slug.png',
    async (request, reply) => {
      const { size, slug } = request.params;
      const result = await server.imageCache.getImage('board', slug, size);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return reply.send(result.data);
    },
  );

  /**
   * GET /api/v1/images/vendors/:size/:slug.png
   * Serve cached vendor logo — proxies from CDN on first request.
   */
  server.get<{ Params: { size: string; slug: string } }>(
    '/api/v1/images/vendors/:size/:slug.png',
    async (request, reply) => {
      const { size, slug } = request.params;
      const result = await server.imageCache.getImage('vendor', slug, size);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return reply.send(result.data);
    },
  );

  /**
   * GET /api/v1/images/proxy?url=...
   * Generic image proxy — caches any external image URL locally.
   */
  server.get<{ Querystring: { url: string } }>(
    '/api/v1/images/proxy',
    async (request, reply) => {
      const { url } = request.query;
      if (!url) return reply.code(400).send({ error: 'Missing url parameter' });

      const validation = validateProxyUrl(url);
      if (!validation.valid) {
        return reply.code(403).send({ error: validation.reason });
      }

      const result = await server.imageCache.getByUrl(url);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      return reply.send(result.data);
    },
  );
}
