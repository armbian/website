import type { FastifyInstance } from 'fastify';
import type { DataStore } from './services/datastore.js';
import type { ImageCache } from './services/image-cache.js';
import type { QdlAssetCache } from './services/qdl-cache.js';

/** Extend Fastify instance with our services */
declare module 'fastify' {
  interface FastifyInstance {
    store: DataStore;
    imageCache: ImageCache;
    qdlCache: QdlAssetCache;
  }
}

export type AppInstance = FastifyInstance & {
  store: DataStore;
  imageCache: ImageCache;
  qdlCache: QdlAssetCache;
};
