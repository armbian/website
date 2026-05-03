import type { FastifyInstance } from 'fastify';
import { IMAGE_SIZES } from '@armbian/config';
import { validateProxyUrl } from '../services/image-cache.js';
import '../types.js';

const VALID_IMAGE_SIZES = new Set<string>([IMAGE_SIZES.BOARD, IMAGE_SIZES.VENDOR]);

// 1h fresh + 24h stale-while-revalidate. Keeps the browser revalidating once
// per hour (via If-None-Match → 304) so vendor/board logo updates propagate
// within an hour, while still serving stale instantly during SWR.
const IMAGE_CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

export function registerImageRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/images/boards/:size/:slug.png
   * Serve cached board image — proxies from CDN on first request.
   */
  server.get<{ Params: { size: string; slug: string } }>(
    '/api/v1/images/boards/:size/:slug.png',
    async (request, reply) => {
      const { size, slug } = request.params;
      if (!VALID_IMAGE_SIZES.has(size)) {
        return reply.code(400).send({ error: 'Invalid size parameter' });
      }
      const result = await server.imageCache.getImage('board', slug, size);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', IMAGE_CACHE_CONTROL);
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
      if (!VALID_IMAGE_SIZES.has(size)) {
        return reply.code(400).send({ error: 'Invalid size parameter' });
      }
      const result = await server.imageCache.getImage('vendor', slug, size);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', IMAGE_CACHE_CONTROL);
      return reply.send(result.data);
    },
  );

  /**
   * GET /api/v1/images/partners/:slug.png
   * Serve cached partner logo — fetches from source URL on first request.
   */
  server.get<{ Params: { slug: string } }>(
    '/api/v1/images/partners/:slug.png',
    async (request, reply) => {
      const { slug } = request.params;
      const sourceUrl = server.store.getPartnerLogoSource(slug);
      if (!sourceUrl) {
        return reply.code(404).send({ error: 'Partner logo not found' });
      }
      const result = await server.imageCache.getPartnerImage(slug, sourceUrl);
      if (!result) {
        return reply.code(404).send({ error: 'Image not found' });
      }
      void reply.header('Content-Type', result.contentType);
      void reply.header('Cache-Control', IMAGE_CACHE_CONTROL);
      return reply.send(result.data);
    },
  );

  /**
   * GET /api/v1/images/proxy?url=...
   * Generic image proxy — caches any external image URL locally.
   */
  server.get<{ Querystring: { url: string } }>('/api/v1/images/proxy', async (request, reply) => {
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
    void reply.header('Cache-Control', IMAGE_CACHE_CONTROL);
    return reply.send(result.data);
  });
}
