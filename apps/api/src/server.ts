import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import helmet from '@fastify/helmet';

import underPressure from '@fastify/under-pressure';
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
const INTERNAL_API_KEY = process.env['INTERNAL_API_KEY'];

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
    trustProxy: false,
  });

  // --- Security: API key authentication ---

  if (INTERNAL_API_KEY) {
    server.addHook('preHandler', async (request, reply) => {
      // Health endpoint stays open for Docker healthchecks
      if (request.url === '/api/v1/health') return;
      // All other requests must provide a valid API key
      const provided = request.headers['x-api-key'];
      if (provided !== INTERNAL_API_KEY) {
        void reply.status(401).send({ error: 'Unauthorized', statusCode: 401 });
      }
    });
    server.log.info('API key authentication enabled');
  } else if (!IS_DEV) {
    server.log.warn('INTERNAL_API_KEY not set — API is unprotected. Set it in .env for production.');
  }

  // --- Plugins ---

  await server.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    dnsPrefetchControl: { allow: false },
  });

  // Extra CORS origins from env (e.g. PUBLIC_API_URL origin for Docker)
  const extraOrigins = process.env['CORS_ORIGINS']?.split(',').filter(Boolean) ?? [];
  const allOrigins = [...CORS_ALLOWED_ORIGINS, ...extraOrigins];

  await server.register(cors, {
    origin: IS_DEV ? true : allOrigins,
    methods: ['GET', 'OPTIONS'],
    credentials: false,
  });


  await server.register(underPressure, {
    maxEventLoopDelay: 1000,
    maxHeapUsedBytes: 500_000_000,
    maxRssBytes: 800_000_000,
    retryAfter: 50,
    message: 'Service temporarily unavailable',
  });

  await server.register(compress, {
    threshold: 512,
    encodings: ['br', 'gzip', 'deflate'],
  });
  await server.register(etag);

  // No-cache on error responses
  server.addHook('onSend', async (_request, reply) => {
    if (reply.statusCode >= 400 && !reply.hasHeader('cache-control')) {
      void reply.header('Cache-Control', 'no-store');
    }
  });

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
