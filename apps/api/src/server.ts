import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { SyncService } from './services/sync.service.js';
import { DataStore } from './services/datastore.js';
import { registerBoardRoutes } from './routes/boards.js';
import { registerVendorRoutes } from './routes/vendors.js';
import { registerSearchRoutes } from './routes/search.js';
import { registerPartnerRoutes } from './routes/partners.js';
import { registerMaintainerRoutes } from './routes/maintainers.js';
import { registerRedirectRoutes } from './routes/redirects.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerPageRoutes } from './routes/pages.js';
import { registerImageRoutes } from './routes/images.js';
import { ImageCache } from './services/image-cache.js';

const PORT = parseInt(process.env['API_PORT'] ?? process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const CACHE_DIR = process.env['CACHE_DIR'] ?? './data/.cache';
const SYNC_INTERVAL_MS = parseInt(process.env['DATA_SYNC_INTERVAL_MS'] ?? '3600000', 10);
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';
const IS_DEV = process.env['NODE_ENV'] !== 'production';

/** Allowed CORS origins for production (all Armbian domains) */
const CORS_ALLOWED_ORIGINS = [
  'https://www.armbian.com',
  'https://armbian.com',
  'https://armbian.cn',
  'https://armbian.de',
  'https://imager.armbian.com',
];

async function main(): Promise<void> {
  const server = Fastify({
    logger: {
      level: LOG_LEVEL,
      ...(IS_DEV ? { transport: { target: 'pino-pretty' } } : {}),
    },
  });

  // --- Plugins ---

  await server.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Extra CORS origins from env (e.g. PUBLIC_API_URL origin for Docker)
  const extraOrigins = process.env['CORS_ORIGINS']?.split(',').filter(Boolean) ?? [];
  const allOrigins = [...CORS_ALLOWED_ORIGINS, ...extraOrigins];

  await server.register(cors, {
    origin: IS_DEV ? true : allOrigins,
    methods: ['GET', 'OPTIONS'],
    credentials: false,
  });

  await server.register(rateLimit, {
    max: 500,
    timeWindow: '1 minute',
    allowList: (req) => {
      const ip = req.ip;
      // Skip rate limit for localhost, Docker, and private networks (RFC 1918)
      return ip === '127.0.0.1' || ip === '::1'
        || ip.startsWith('10.')
        || ip.startsWith('192.168.')
        || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
        || ip.startsWith('::ffff:10.')
        || ip.startsWith('::ffff:192.168.')
        || /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(ip);
    },
  });

  await server.register(compress, {
    threshold: 512,
    encodings: ['br', 'gzip', 'deflate'],
  });
  await server.register(etag);

  await server.register(swagger, {
    openapi: {
      info: {
        title: 'Armbian API',
        description: 'Shared data API for Armbian website and Imager',
        version: '1.0.0',
      },
      servers: IS_DEV
        ? [{ url: `http://localhost:${PORT}` }]
        : [{ url: 'https://api.armbian.com' }],
    },
  });

  if (IS_DEV) {
    await server.register(swaggerUi, {
      routePrefix: '/api/docs',
    });
  }

  // --- Data Layer ---

  const store = new DataStore();
  const apiBase = process.env['API_BASE_PATH'] ?? '';
  const sync = new SyncService(store, server.log, apiBase);
  const imageCache = new ImageCache(CACHE_DIR, server.log);

  // Initial data load — try disk cache first for fast startup, then sync from network
  const cached = await sync.loadFromCache();
  if (!cached) {
    server.log.info('No disk cache found, fetching from network...');
    await sync.sync();
  } else {
    // Cache loaded — schedule a background refresh to get fresh data
    sync.sync().catch((err) => server.log.warn({ err }, 'Background sync after cache load failed'));
  }
  server.log.info(
    { boardCount: store.getBoardCount(), imageCount: store.getImageCount() },
    'Initial data ready',
  );

  // Schedule periodic sync
  sync.startCron(SYNC_INTERVAL_MS);

  // Warm up image cache in background (don't block startup)
  const boardSlugs = store.getBoards({ sort: 'popularity' }).boards.map(b => b.slug);
  const vendorSlugs = store.getVendors().map(v => v.slug);
  imageCache.warmup(boardSlugs, vendorSlugs).catch((err) =>
    server.log.warn({ err }, 'Image warmup failed'),
  );

  // Decorate Fastify with store and image cache
  server.decorate('store', store);
  server.decorate('imageCache', imageCache);

  // --- Routes ---

  registerBoardRoutes(server);
  registerVendorRoutes(server);
  registerSearchRoutes(server);
  registerPartnerRoutes(server);
  registerMaintainerRoutes(server);
  registerRedirectRoutes(server);
  registerHealthRoutes(server, sync);
  registerStatsRoutes(server);
  registerPageRoutes(server);
  registerImageRoutes(server);

  // --- Start ---

  try {
    await server.listen({ port: PORT, host: HOST });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    server.log.info('Shutting down...');
    sync.stopCron();
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
