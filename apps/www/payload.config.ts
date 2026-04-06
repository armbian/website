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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || (() => { throw new Error('PAYLOAD_SECRET env var is required') })(),

  admin: {
    user: Users.slug,
    meta: { titleSuffix: '— Armbian Admin' },
  },

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || (() => { throw new Error('DATABASE_URL env var is required') })(),
    },
  }),

  collections: [Users, Media, FlashGuides, Announcements, Pages, Changelogs],

  globals: [CompanyConfig],

  typescript: {
    outputFile: path.resolve(__dirname, 'src/payload-types.ts'),
  },
});
