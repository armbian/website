import Fastify from 'fastify';
import cors from '@fastify/cors';
import compress from '@fastify/compress';
import etag from '@fastify/etag';
import helmet from '@fastify/helmet';
import { ARMBIAN_URLS } from '@armbian/config';

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
import { registerContactRoutes } from './routes/contact.js';
import { registerImagerRoutes } from './routes/imager.js';
import { registerQdlRoutes } from './routes/qdl.js';
import { ImageCache } from './services/image-cache.js';
import { QdlAssetCache } from './services/qdl-cache.js';

const PORT = parseInt(process.env['API_PORT'] ?? process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const CACHE_DIR = process.env['CACHE_DIR'] ?? './data/.cache';
const SYNC_INTERVAL_MS = parseInt(process.env['DATA_SYNC_INTERVAL_MS'] ?? '3600000', 10);
const LOG_LEVEL = process.env['LOG_LEVEL'] ?? 'info';
const IS_DEV = process.env['NODE_ENV'] !== 'production';
/** Allowed CORS origins for production (all Armbian domains) */
const CORS_ALLOWED_ORIGINS = [
  ARMBIAN_URLS.WEBSITE,
  'https://armbian.com',
  'https://armbian.cn',
  'https://armbian.de',
  ARMBIAN_URLS.IMAGER,
];

async function main(): Promise<void> {
  const server = Fastify({
    logger: {
      level: LOG_LEVEL,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,reqId',
          singleLine: true,
        },
      },
    },
    // Caddy overwrites XFF with the real peer (see Caddyfile), so request.ip is
    // trustworthy and cannot be spoofed.
    trustProxy: true,
    disableRequestLogging: true,
  });

  // Custom single-line request logger
  server.addHook('onResponse', async (request, reply) => {
    const method = request.method;
    const url = request.url;
    const status = reply.statusCode;
    const ms = reply.elapsedTime.toFixed(1);
    const ip = request.ip;
    const symbol = status >= 500 ? '◉' : status >= 400 ? '○' : '●';
    request.log.info(`${symbol} ${method} ${url} ${status} ${ms}ms ← ${ip}`);
  });

  // --- Security: require client identification header ---
  // Public API, but non-image requests without X-Armbian-Client are rejected to
  // prevent casual browser scraping. The header is not a secret — it identifies
  // the client (official website, Imager, third-party tools) for logging.
  // Image routes are excluded because browsers load them via <img src> and
  // cannot set custom headers on navigation requests.
  server.addHook('preHandler', async (request, reply) => {
    if (request.url === '/api/v1/health') return;
    if (request.url.startsWith('/api/v1/images/')) return;
    // QDL blobs are public firehose assets fetched by the imager's plain download
    // client (no custom headers), same rationale as images.
    if (request.url.startsWith('/api/v1/qdl/')) return;
    const client = request.headers['x-armbian-client'];
    if (typeof client !== 'string' || client.length === 0) {
      void reply.status(403).send({ error: 'Client identification required', statusCode: 403 });
    }
  });

  // --- Plugins ---

  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
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

  // Dev mode: allow any origin so local hosts (127.0.0.1, the
  // Caddy-mapped imager port, dev tunnels, etc.) can reach the API
  // without us maintaining an exhaustive list. Production uses the
  // explicit allowlist above.
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

  // Swagger UI is only served in dev mode — not exposed in production.
  if (IS_DEV) {
    await server.register(swaggerUi, {
      routePrefix: '/api/docs',
    });
  }

  // --- Data Layer ---

  const store = new DataStore();
  const imageCache = new ImageCache(CACHE_DIR, server.log);
  const qdlCache = new QdlAssetCache(CACHE_DIR, server.log);
  const sync = new SyncService(store, server.log, imageCache, qdlCache);

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

  // Schedule periodic sync. `sync()` itself triggers a conditional-GET
  // refresh of the image cache at the end of each cycle, so no separate
  // warmup step is needed — the first sync populates the cache from
  // scratch, subsequent ones only revalidate against the CDN.
  sync.startCron(SYNC_INTERVAL_MS);

  // Decorate Fastify with store and image cache
  server.decorate('store', store);
  server.decorate('imageCache', imageCache);
  server.decorate('qdlCache', qdlCache);

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
  registerContactRoutes(server);
  registerImagerRoutes(server);
  registerQdlRoutes(server);

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
