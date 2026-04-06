import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

function sanitizeSlug(s: string): string {
  return s.replace(/[^a-z0-9-]/gi, '').slice(0, 100);
}

export function registerBoardRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/boards
   * List boards with filtering and pagination.
   */
  server.get<{
    Querystring: {
      vendor?: string;
      architecture?: string;
      support?: string;
      search?: string;
      sort?: string;
      promoted?: string;
      page?: string;
      limit?: string;
    };
  }>('/api/v1/boards', (request, reply) => {
    const {
      vendor,
      architecture,
      support,
      search,
      sort,
      promoted,
      page: rawPage,
      limit: rawLimit,
    } = request.query;

    const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(rawLimit ?? '50', 10) || 50));

    const { boards, total } = server.store.getBoards({
      vendor,
      architecture,
      support: support as 'platinum' | 'standard' | 'community' | 'wip' | 'eos' | 'tvb' | undefined,
      search,
      sort: (sort as 'name' | 'popularity' | 'support') ?? 'popularity',
      promoted: promoted !== undefined ? promoted === 'true' : undefined,
    });

    const start = (page - 1) * limit;
    const paginated = boards.slice(start, start + limit);

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: paginated,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total,
        page,
        limit,
      },
    };
  });

  /**
   * GET /api/v1/boards/:slug
   * Single board detail.
   */
  server.get<{
    Params: { slug: string };
  }>('/api/v1/boards/:slug', (request, reply) => {
    const board = server.store.getBoard(request.params.slug);

    if (!board) {
      void reply.status(404);
      return {
        error: 'Not Found',
        message: `Board '${sanitizeSlug(request.params.slug)}' not found`,
        statusCode: 404,
      };
    }

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: board,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
      },
    };
  });

  /**
   * GET /api/v1/boards/:slug/images
   * Images available for a specific board.
   */
  server.get<{
    Params: { slug: string };
    Querystring: {
      variant?: string;
      distribution?: string;
      branch?: string;
      promoted?: string;
    };
  }>('/api/v1/boards/:slug/images', (request, reply) => {
    const board = server.store.getBoard(request.params.slug);

    if (!board) {
      void reply.status(404);
      return {
        error: 'Not Found',
        message: `Board '${sanitizeSlug(request.params.slug)}' not found`,
        statusCode: 404,
      };
    }

    const { variant, distribution, branch, promoted } = request.query;

    const images = server.store.getBoardImages(request.params.slug, {
      variant,
      distribution,
      branch,
      promoted: promoted !== undefined ? promoted === 'true' : undefined,
    });

    void reply.header('Cache-Control', CACHE_CONTROL);
    return {
      data: images,
      meta: {
        last_sync: server.store.metadata.lastSync?.toISOString() ?? null,
        total: images.length,
      },
    };
  });
}
