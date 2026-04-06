import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { Users } from './src/payload/collections/Users';
import { Media } from './src/payload/collections/Media';
import { FlashGuides } from './src/payload/collections/FlashGuides';
import { Announcements } from './src/payload/collections/Announcements';
import { Pages } from './src/payload/collections/Pages';
import { Changelogs } from './src/payload/collections/Changelogs';
import { CompanyConfig } from './src/payload/globals/CompanyConfig';
import { migrations } from './src/migrations';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && !isBuildPhase) {
    throw new Error(`${key} env var is required`);
  }
  return value || `placeholder-${key}`;
}

export default buildConfig({
  secret: requireEnv('PAYLOAD_SECRET'),

  admin: {
    user: Users.slug,
    meta: { titleSuffix: '— Armbian Admin' },
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    prodMigrations: migrations,
    pool: {
      connectionString: requireEnv('DATABASE_URL'),
    },
  }),

  collections: [Users, Media, FlashGuides, Announcements, Pages, Changelogs],

  globals: [CompanyConfig],

  typescript: {
    outputFile: path.resolve(__dirname, 'src/payload-types.ts'),
  },
});
