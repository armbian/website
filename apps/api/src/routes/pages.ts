import type { FastifyInstance } from 'fastify';
import '../types.js';

const CACHE_CONTROL = 'public, max-age=300, stale-while-revalidate=600';

// Pre-serialized JSON cache — rebuilt on each data sync, zero allocation per request
let homeCache: string | null = null;
let boardsPageCache: string | null = null;
let boardsInitCache: string | null = null;
let lastSyncKey: string | null = null;

function rebuildCaches(server: FastifyInstance): void {
  const store = server.store;
  const syncKey = store.metadata.lastSync?.toISOString() ?? '';
  if (syncKey === lastSyncKey) return;
  lastSyncKey = syncKey;

  const { boards: platBoards } = store.getBoards({ support: 'platinum', sort: 'popularity' });
  const { boards: promotedBoards } = store.getBoards({ promoted: true, sort: 'popularity' });
  const partners = store.getPartners();
  const { boardCount, imageCount, vendorCount } = store.metadata;

  homeCache = JSON.stringify({
    data: {
      platinum_boards: platBoards.slice(0, 20),
      promoted_boards: promotedBoards.slice(0, 20),
      partners,
      stats: { boards: boardCount, images: imageCount, vendors: vendorCount },
    },
    meta: { lastSync: store.metadata.lastSync },
  });

  const { boards, total } = store.getBoards({ sort: 'popularity' });
  const vendors = store.getVendors();

  boardsPageCache = JSON.stringify({
    data: { boards, vendors, total },
    meta: { lastSync: store.metadata.lastSync },
  });

  // Lightweight init payload — tier counts, vendors, first page + platinum
  const tierCounts: Record<string, number> = {};
  for (const b of boards) {
    tierCounts[b.support_tier] = (tierCounts[b.support_tier] || 0) + 1;
  }
  boardsInitCache = JSON.stringify({
    data: {
      boards: boards.slice(0, 24),
      platinumBoards: boards.filter((b) => b.support_tier === 'platinum' && b.image_url),
      vendors,
      total,
      tierCounts,
    },
    meta: { lastSync: store.metadata.lastSync },
  });
}

export function registerPageRoutes(server: FastifyInstance): void {
  /**
   * GET /api/v1/pages/home
   * Pre-serialized aggregated endpoint — zero allocation per request.
   */
  server.get('/api/v1/pages/home', (_request, reply) => {
    rebuildCaches(server);
    void reply.header('Cache-Control', CACHE_CONTROL);
    void reply.header('Content-Type', 'application/json');
    return reply.send(homeCache);
  });

  /**
   * GET /api/v1/pages/boards
   * Pre-serialized aggregated endpoint — zero allocation per request.
   */
  server.get('/api/v1/pages/boards', (_request, reply) => {
    rebuildCaches(server);
    void reply.header('Cache-Control', CACHE_CONTROL);
    void reply.header('Content-Type', 'application/json');
    return reply.send(boardsPageCache);
  });

  /**
   * GET /api/v1/pages/boards-init
   * Lightweight initial payload for boards page SSR — vendors, tier counts, first page of boards.
   */
  server.get('/api/v1/pages/boards-init', (_request, reply) => {
    rebuildCaches(server);
    void reply.header('Cache-Control', CACHE_CONTROL);
    void reply.header('Content-Type', 'application/json');
    return reply.send(boardsInitCache);
  });
}
