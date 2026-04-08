# Development Guide

This guide covers local development, architecture, and common workflows for the Armbian website project.

## Prerequisites

You need:

- **Docker** (latest version)
- **Docker Compose v2** (built into recent Docker Desktop, or install separately)
- **Git** (for cloning and version control)
- **bash/zsh** (standard on macOS and Linux)

Node.js, pnpm, and build tools are all containerized—no local installation needed.

## Getting Started

### 1. Clone and Configure

```bash
git clone https://github.com/armbian/armbian-site.git
cd armbian-site
cp .env.example .env
```

### 2. Generate Secrets

Edit `.env` and fill in the required secrets. Generate them with:

```bash
# POSTGRES_PASSWORD: strong random password
openssl rand -hex 32

# PAYLOAD_SECRET: 64-character hex string
openssl rand -hex 32
```

Example `.env`:

```
POSTGRES_PASSWORD=a7f8e3d2c9b1a6f4e2d8c7b9a1f3e5d6
PAYLOAD_SECRET=9a7f3e2d1c6b8a4f9e7d2c8b1a3f5e6d4c9b2a8f7e1d3c6b9a4f2e8d7c1b
```

### 3. Start All Services

```bash
./manage.sh up
```

This builds and starts the Docker Compose stack:

- **www**: Next.js frontend at `http://localhost:3000`
- **api**: Fastify REST API at `http://localhost:3001`
- **postgres**: PostgreSQL at `localhost:5432` (for Payload CMS)

The `manage.sh up` command waits for health checks and shows endpoint status.

Once running, open `http://localhost:3000` in your browser. The Payload CMS admin panel is at `http://localhost:3000/admin`.

## Architecture Overview

### Project Structure

```
armbian-site/
├── apps/
│   ├── api/              # Fastify 5 REST API
│   │   ├── src/
│   │   │   ├── server.ts # Entry point
│   │   │   └── types.ts  # TypeScript definitions
│   │   └── Dockerfile
│   └── www/              # Next.js 16 frontend + Payload CMS
│       ├── src/
│       │   ├── app/      # App Router with route groups
│       │   ├── messages/ # i18n translation files
│       │   ├── payload/  # Payload CMS collections, globals, access control
│       │   ├── migrations/ # Database migrations
│       │   └── lib/      # Utility functions
│       ├── payload.config.ts
│       ├── next.config.ts
│       └── Dockerfile
├── packages/             # Shared libraries
│   ├── schemas/         # Zod schemas (single source of truth)
│   ├── config/          # Constants, URLs, locales, support tiers
│   ├── api-client/      # TypeScript HTTP client
│   └── theme/           # CSS variables + Tailwind preset
├── manage.sh            # CLI for development tasks
├── docker-compose.yml   # Service definitions
├── .env.example         # Environment template
└── CLAUDE.md            # Architecture reference
```

### Monorepo Structure

The project uses **Turborepo** with **pnpm workspaces**:

- **Two apps**: `@armbian/api` and `@armbian/www`
- **Four packages**: `@armbian/schemas`, `@armbian/config`, `@armbian/api-client`, `@armbian/theme`

All code is containerized. Development happens inside Docker—no local build artifacts.

### Data Flow

```
github.armbian.com (upstream JSON)
  ↓
API SyncService (fetches every 4h)
  ↓
Normalizer (validates via Zod schemas)
  ↓
DataStore (in-memory cache + MiniSearch index)
  ↓
Fastify REST API (/api/v1/*)
  ↓
www app (fetches server-side via getApiClient())
```

The API normalizes upstream JSON from GitHub's board/image/vendor endpoints. The www app fetches via a typed HTTP client and serves pre-rendered pages with SSR.

**Payload CMS** stores editorial content (flash guides, announcements, pages, changelogs) in PostgreSQL. The www app queries Payload directly in server components via `getPayload({ config })`. Migrations run automatically on startup.

### Route Groups: CSS Isolation

The www app uses Next.js route groups to prevent Tailwind's global styles from breaking Payload's admin UI:

```
apps/www/src/app/
├── layout.tsx                    # Root (returns children, no HTML)
├── (frontend)/                   # Armbian website
│   ├── layout.tsx                # Imports globals.css (Tailwind + Armbian theme)
│   ├── globals.css               # NOT loaded by Payload admin
│   └── [locale]/                 # i18n pages with <html lang={locale}>
│       └── layout.tsx            # HTML shell, Navbar, Footer
└── (payload)/                    # Payload CMS admin panel
    ├── layout.tsx                # Payload's own HTML shell
    ├── admin/[[...segments]]/    # Admin UI at /admin
    └── api/[...slug]/            # Payload REST API routes
```

**Why this matters**: Tailwind's preflight CSS resets form styles globally. Payload's admin needs its own styled form elements. By using route groups, each domain has isolated CSS:

- `(frontend)` imports `globals.css` → Armbian website gets Tailwind + theme
- `(payload)` does NOT import `globals.css` → Payload admin uses its own styles

### Server vs Client Components

**Default: server components**. Pages and layouts are async server components. They use:

```typescript
import { getTranslations } from 'next-intl/server';
import { getApiClient } from '@/lib/api';

export default async function Page({ params }) {
  const t = getTranslations();
  const api = getApiClient();
  const data = await api.boards.list();
  
  return <h1>{t('boards.title')}</h1>;
}
```

**Client components**: Only interactive UI uses `'use client'` — search, filters, theme toggle, modals, animations. They use:

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function SearchBox() {
  const t = useTranslations();
  const [query, setQuery] = useState('');
  
  return <input placeholder={t('search.placeholder')} />;
}
```

Benefits:
- Minimal client-side JavaScript
- Server components fetch data at render time
- Better SEO (HTML pre-rendered)
- Reduced secrets exposure (API calls on server)

### Payload CMS Build Phase Detection

During `next build`, real secrets and database aren't available. Payload handles this with `NEXT_PHASE` detection:

```typescript
// payload.config.ts
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value && !isBuildPhase) {
    throw new Error(`${key} env var is required`);
  }
  return value || `placeholder-${key}`;
}
```

At build time, placeholder values are used. Real secrets are injected at runtime by Docker Compose. Payload migrations run automatically via `prodMigrations` on container startup.

## Common Development Tasks

### Rebuilding After Code Changes

After editing source files:

```bash
# Rebuild and restart a specific service
./manage.sh rebuild www
./manage.sh rebuild api

# Or rebuild all services
./manage.sh rebuild
```

Docker caches layer-by-layer, so rebuilds are fast after the first build.

### Viewing Logs

```bash
# Follow all services
./manage.sh logs

# Follow a specific service
./manage.sh logs www
./manage.sh logs api
./manage.sh logs postgres
```

Use `Ctrl+C` to stop following logs.

### Opening a Container Shell

```bash
# Default: www container
./manage.sh shell

# Specific service
./manage.sh shell api
./manage.sh shell postgres
```

Use `exit` to close the shell. Useful for debugging or running one-off commands inside containers.

### Connecting to PostgreSQL

```bash
# Open psql prompt
./manage.sh db

# Or run a single command
./manage.sh shell postgres
psql -U payload -d payload -c "SELECT COUNT(*) FROM payload_users;"
```

### Database Backup and Restore

```bash
# Backup (creates backups/payload_YYYYMMDD_HHMMSS.sql.gz)
./manage.sh db:backup

# Restore from backup
./manage.sh db:restore backups/payload_20260101_120000.sql.gz

# List backups
ls -lh backups/
```

Useful before making schema changes or testing migrations.

### Resetting Everything

To wipe the database and rebuild from scratch:

```bash
./manage.sh reset
```

This stops all services, removes all volumes (including the PostgreSQL database), and rebuilds from scratch with empty schemas.

### Adding a New Page

Pages use Next.js App Router. To add a page at `/about`:

1. **Create the server component**:

```typescript
// apps/www/src/app/(frontend)/[locale]/about/page.tsx
import { getTranslations } from 'next-intl/server';
import { getApiClient } from '@/lib/api';

export const metadata = {
  title: 'About',
  description: 'About Armbian',
};

export default async function AboutPage() {
  const t = getTranslations();
  const api = getApiClient();
  
  return (
    <div>
      <h1>{t('about.title')}</h1>
      <p>{t('about.description')}</p>
    </div>
  );
}
```

2. **Add i18n keys** to `apps/www/src/messages/en.json`:

```json
{
  "about": {
    "title": "About Armbian",
    "description": "Learn more about the Armbian project..."
  }
}
```

3. **Sync to other locales** (see [Adding i18n Keys](#adding-i18n-translation-keys) below).

4. **Rebuild and test**:

```bash
./manage.sh rebuild www
# Visit http://localhost:3000/about
```

Key patterns:
- Use `getTranslations()` in server components
- Fetch data from API with `getApiClient()`
- All text goes in `messages/{locale}.json`
- No hardcoded strings

### Adding a Payload CMS Collection

Collections store data in PostgreSQL. The Payload admin panel at `/admin` lets editors manage entries.

**Step-by-step:**

1. **Create the collection file**:

```typescript
// apps/www/src/payload/collections/MyCollection.ts
import { CollectionConfig } from 'payload';

export const MyCollection: CollectionConfig = {
  slug: 'my-items',
  labels: {
    singular: 'Item',
    plural: 'Items',
  },
  admin: {
    useAsTitle: 'name', // Field shown in list
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
};
```

2. **Register in payload.config.ts**:

```typescript
// apps/www/payload.config.ts
import { MyCollection } from './src/payload/collections/MyCollection';

export default buildConfig({
  // ...
  collections: [
    Users,
    Media,
    FlashGuides,
    Announcements,
    Pages,
    Changelogs,
    MyCollection,  // Add here
  ],
  // ...
});
```

3. **Generate a migration**:

Open a container shell and generate a migration:

```bash
./manage.sh shell www
cd /app/apps/www
pnpm payload migrate:create
```

This creates `src/migrations/20260406_001234_CreateMyCollection.ts`.

4. **Register the migration**:

```typescript
// apps/www/src/migrations/index.ts
import { CreateMyCollection } from './20260406_001234_CreateMyCollection';

export const migrations = [
  // ... existing migrations
  CreateMyCollection,
];
```

5. **Rebuild and test**:

```bash
./manage.sh rebuild www
```

Payload auto-applies pending migrations on startup. Check the www logs:

```bash
./manage.sh logs www
```

Look for "Migration status: pending" or "Migrations complete".

6. **Query in your code**:

```typescript
// Server component
import { getPayload } from 'payload';
import config from '@payload-config';

export default async function MyPage() {
  const payload = await getPayload({ config });
  const items = await payload.find({
    collection: 'my-items',
  });
  
  return <div>/* render items */</div>;
}
```

### Adding i18n Translation Keys

All user-facing text uses translation keys. **Single source of truth: `apps/www/src/messages/en.json`**.

1. **Add to en.json**:

```json
{
  "boards": {
    "title": "Armbian Boards",
    "empty": "No boards found"
  }
}
```

2. **Sync to all 16 other locales** (it, de, zh, fr, es, pt, ru, ja, ko, pl, nl, tr, uk, hr, sl, sv):

Copy the structure to each locale file, translating the values. For now, English values are acceptable if translations aren't ready.

Example `apps/www/src/messages/de.json`:

```json
{
  "boards": {
    "title": "Armbian Boards",
    "empty": "Keine Boards gefunden"
  }
}
```

3. **Use in components**:

```typescript
// Server component
import { getTranslations } from 'next-intl/server';

export default async function BoardsPage() {
  const t = getTranslations();
  return <h1>{t('boards.title')}</h1>;
}
```

```typescript
// Client component
'use client';
import { useTranslations } from 'next-intl';

export default function EmptyMessage() {
  const t = useTranslations();
  return <p>{t('boards.empty')}</p>;
}
```

Key rules:
- Every user-facing string goes in `messages/en.json`
- Always sync changes to all 16 locale files
- Use dot notation for nested keys: `boards.title`, `forms.errors.required`
- Translations should stay in sync—don't leave keys untranslated unless absolutely necessary

### Adding API Endpoints

API logic lives in `apps/api/src/`. The API normalizes data from upstream sources and serves via REST.

```typescript
// apps/api/src/routes/boards.ts
import { FastifyInstance } from 'fastify';

export async function registerBoardRoutes(app: FastifyInstance) {
  app.get('/api/v1/boards', async (request, reply) => {
    // Data comes from DataStore (normalized + cached)
    const boards = await dataStore.getAllBoards();
    return reply.send(boards);
  });
}
```

Endpoints are typed via Zod schemas in `packages/schemas/`. The www app fetches with a typed client.

The API client (`packages/api-client/`) wraps fetch() and provides type safety:

```typescript
// Server component
const api = getApiClient();
const boards = await api.boards.list();
```

## Shared Packages

### @armbian/schemas

**Location**: `packages/schemas/`

Zod schemas define all data types. Single source of truth for validation.

```typescript
import { z } from 'zod';

export const BoardSchema = z.object({
  slug: z.string(),
  name: z.string(),
  type: z.enum(['sbc', 'server', 'tv']),
  releaseDate: z.date().optional(),
});

export type Board = z.infer<typeof BoardSchema>;
```

**When to modify**: Add a new schema when you create a new data structure (e.g., a Payload collection or API response). Update when data requirements change.

### @armbian/config

**Location**: `packages/config/`

Constants, URLs, locale info, and OS metadata. Shared across all apps.

```typescript
// packages/config/src/index.ts
export const ARMBIAN_URLS = {
  github: 'https://github.com/armbian',
  docs: 'https://docs.armbian.com',
  forum: 'https://forum.armbian.com',
};

export const LOCALES = ['en', 'de', 'fr', ...];

export const SUPPORT_TIERS = {
  STABLE: { name: 'Stable', color: 'green' },
  TESTING: { name: 'Testing', color: 'yellow' },
  ...
};

export function boardImageUrl(slug: string): string {
  return `https://images.armbian.com/boards/${slug}.png`;
}
```

**When to modify**: Add shared constants here instead of hardcoding in components. Keep this package lean—only truly shared values.

### @armbian/api-client

**Location**: `packages/api-client/`

Typed HTTP client wrapping fetch(). Consumed by the www app.

```typescript
// packages/api-client/src/index.ts
export class ApiClient {
  async getBoards(): Promise<Board[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/boards`);
    return res.json();
  }
}

// Server component usage
const api = getApiClient();
const boards = await api.boards.list();
```

**When to modify**: Add methods when the API adds new endpoints. Keep methods consistent with API schema.

### @armbian/theme

**Location**: `packages/theme/`

Tailwind configuration and CSS custom properties. Shared by www app.

```typescript
// packages/theme/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        fg: 'var(--fg)',
      },
      fontSize: {
        'fluid-hero': 'clamp(2rem, 5vw, 3.5rem)',
      },
    },
  },
};
```

```css
/* packages/theme/src/theme.css */
:root {
  --brand: #ff7d3d;
  --bg: #ffffff;
  --fg: #000000;
  --border: #e0e0e0;
}

.dark {
  --bg: #1a1a1a;
  --fg: #ffffff;
}
```

**When to modify**: Change colors, spacing, typography, or add custom CSS classes here. Keep theme centralized so design updates affect all apps.

## Styling Guide

### Tailwind 4

The project uses **Tailwind CSS v4** with the typography plugin.

```bash
# Already included in package.json
pnpm add -D tailwindcss @tailwindcss/typography
```

### CSS Custom Properties (CSS Variables)

Colors and spacing use CSS variables for easy theming:

```css
/* In globals.css or theme.css */
:root {
  --brand: #ff7d3d;
  --bg: #ffffff;
  --fg: #000000;
  --border: #e0e0e0;
}

/* Dark mode */
.dark {
  --bg: #1a1a1a;
  --fg: #ffffff;
}
```

Use in components:

```typescript
<div className="bg-[var(--bg)] text-[var(--fg)]">
  {children}
</div>
```

Or in Tailwind config:

```typescript
theme: {
  colors: {
    brand: 'var(--brand)',
    bg: 'var(--bg)',
    fg: 'var(--fg)',
  },
}
```

### Dark Mode

Class-based dark mode variant in `globals.css`:

```css
@variant dark (&:where(.dark, .dark *))
```

Apply dark styles with `dark:` prefix:

```typescript
<div className="bg-white dark:bg-black">
  Content
</div>
```

Toggle dark mode by adding/removing the `.dark` class on the root `<html>` element.

### Fluid Typography

Responsive text sizes using `clamp()`:

```css
.text-fluid-hero {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

.text-fluid-lg {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
}

.text-fluid-base {
  font-size: clamp(1rem, 2vw, 1.25rem);
}

.text-fluid-sm {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
}

.text-fluid-xs {
  font-size: clamp(0.75rem, 1vw, 0.875rem);
}
```

Scales smoothly between mobile and desktop viewports.

### Key CSS Classes

**hw-card** — Board cards with hover effects:

```css
.hw-card {
  transition: transform 0.3s, box-shadow 0.3s;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
}

.hw-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.hw-img {
  transition: transform 0.3s;
}

.hw-card:hover .hw-img {
  transform: scale(1.05);
}
```

**bento-card** — Glassmorphism layout:

```css
.bento-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
}
```

**terminal-glass** — Code block styling with glass effect.

**badge-platinum** — Shiny platinum badge for premium support tiers.

**divider-glow** — Glowing horizontal divider.

These classes are in `apps/www/src/app/(frontend)/globals.css`.

## Key Rules

### 1. All User Text Must Use i18n Keys

Never hardcode user-facing strings:

```typescript
// Bad
<h1>Welcome to Armbian</h1>

// Good
import { getTranslations } from 'next-intl/server';
const t = getTranslations();
<h1>{t('home.welcome')}</h1>
```

Add keys to `apps/www/src/messages/en.json`, sync to all 16 locales.

### 2. All Data Must Come from API

Never hardcode board info, counts, URLs, or dynamic data:

```typescript
// Bad
const boards = [
  { slug: 'rpi4', name: 'Raspberry Pi 4' },
  { slug: 'odroid', name: 'ODROID' },
];

// Good
const api = getApiClient();
const boards = await api.boards.list();
```

Use `--` as fallback when API is unavailable.

### 3. URLs Come from @armbian/config

Never hardcode URLs:

```typescript
// Bad
<a href="https://github.com/armbian/armbian">GitHub</a>

// Good
import { ARMBIAN_URLS } from '@armbian/config';
<a href={ARMBIAN_URLS.github}>GitHub</a>
```

Image URLs:

```typescript
import { boardImageUrl, vendorLogoUrl } from '@armbian/config';

<img src={boardImageUrl('rpi4')} alt="Raspberry Pi 4" />
<img src={vendorLogoUrl('broadcom')} alt="Broadcom" />
```

### 4. Sanitize CMS HTML

Always sanitize HTML from Payload before rendering:

```typescript
import { sanitizeCmsHtml } from '@/lib/sanitize';

export default async function Page() {
  const page = await payload.findByID({ collection: 'pages', id: '...' });
  const safeHtml = sanitizeCmsHtml(page.content);
  
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
```

Prevents XSS attacks if CMS content is compromised.

## Environment Variables Reference

All variables are defined in `.env` (copied from `.env.example`). Docker Compose reads these.

| Variable | Used By | Required | Example |
|----------|---------|----------|---------|
| `DATA_SYNC_INTERVAL_MS` | API | No (default: 14400000 = 4h) | `14400000` |
| `CORS_ORIGINS` | API | No | `http://localhost:3000` |
| `PUBLIC_API_URL` | www (client-side) | No | `http://localhost:3001` |
| `LOG_LEVEL` | API | No (default: info) | `info`, `debug`, `warn` |
| `POSTGRES_DB` | postgres | No (default: payload) | `payload` |
| `POSTGRES_USER` | postgres | No (default: payload) | `payload` |
| `POSTGRES_PASSWORD` | postgres, www | **Yes** | 32-char hex string |
| `PAYLOAD_SECRET` | www (Payload CMS) | **Yes** | 64-char hex string |
| `API_URL` | www (server-side) | No (default: http://localhost:3001) | `http://localhost:3001` |
| `DATABASE_URL` | www (Payload ORM) | Injected by compose | `postgresql://payload:...@postgres:5432/payload` |
| `OIDC_CLIENT_ID` | www (auth) | No (optional) | `armbian-cms` |
| `OIDC_CLIENT_SECRET` | www (auth) | No (optional) | `secret-key` |
| `OIDC_ISSUER_URL` | www (auth) | No (optional) | `https://auth.example.com` |
| `OIDC_ALLOWED_DOMAINS` | www (auth) | No (optional, comma-separated) | `armbian.com,arm.com` |

**Required variables**: Without `POSTGRES_PASSWORD` and `PAYLOAD_SECRET`, `docker compose up` fails.

**Optional variables**: Leave empty to disable features (e.g., OIDC auth). If empty, local username/password login is used.

### Default Admin User

On first boot with an empty database, Payload automatically creates a default admin:

- **Email**: `admin@armbian.com`
- **Password**: `changeme`
- **Role**: `admin`

Change the password immediately after first login at `/admin`.

### OIDC Authentication with Authentik

When `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_ISSUER_URL` are set, users can log in via Authentik. Roles are mapped from Authentik groups:

| Authentik Group | Payload Role | Permissions |
|---|---|---|
| `armbian-admin` | admin | Full access: users, content, settings |
| `armbian-editor` | editor | Create/edit/delete content, no user management |
| `armbian-maintainer` | maintainer | Flash guides only (assigned boards) |
| *(no matching group)* | editor | Default for new OIDC users |

**Setup in Authentik:**

1. Create an OAuth2/OIDC provider for the CMS application
2. Add a `groups` scope to the provider (so groups are included in the userinfo response)
3. Create the groups: `armbian-admin`, `armbian-editor`, `armbian-maintainer`
4. Assign users to the appropriate groups
5. Set `OIDC_ALLOWED_DOMAINS` to restrict auto-creation to specific email domains (e.g., `armbian.com`)

**Behavior:**

- First login creates the user automatically with the role matching their Authentik group
- Role syncs on every login — changing a group in Authentik updates the Payload role
- If `OIDC_ALLOWED_DOMAINS` is set, only emails from those domains can auto-register
- Users created via OIDC get a random password (they authenticate via Authentik, not local login)

## Troubleshooting

### Tailwind Styles Not Loading

If the homepage has no styles (unstyled text):

1. Check that `globals.css` is imported in `apps/www/src/app/(frontend)/layout.tsx`
2. Rebuild www:

```bash
./manage.sh rebuild www
```

3. Clear browser cache and hard-refresh (`Cmd+Shift+R` on macOS)

If only Payload admin is broken (styles missing), that's expected—Payload uses its own CSS and route groups prevent conflicts.

### Build Secrets Error

If `next build` fails with "PAYLOAD_SECRET is required":

The build phase detection failed. Check:

```bash
./manage.sh shell www
env | grep NEXT_PHASE
```

Should show `NEXT_PHASE=phase-production-build`. If missing, the Dockerfile may need updating.

### Database Migrations Stuck

If www logs show "Waiting for pending migrations...":

1. Check migration syntax:

```bash
./manage.sh shell www
cd /app/apps/www
pnpm payload migrate:up
```

2. Or restore from backup:

```bash
./manage.sh db:restore backups/payload_LATEST.sql.gz
```

### API Returns 500 Errors

Check API logs:

```bash
./manage.sh logs api
```

Common issues:
- Data sync interval too short (GitHub rate limit)
- Missing upstream JSON endpoint
- Zod schema mismatch

Increase `DATA_SYNC_INTERVAL_MS` to 14400000 (4 hours) if hitting rate limits.

### Postgres Connection Refused

If www or api can't connect to postgres:

1. Check postgres is healthy:

```bash
./manage.sh status
```

2. Check DATABASE_URL is correct:

```bash
./manage.sh shell www
env | grep DATABASE_URL
```

Should be: `postgresql://payload:PASSWORD@postgres:5432/payload`

3. Reset postgres:

```bash
./manage.sh reset
```

### Memory Issues (Docker Desktop)

If containers OOM kill:

1. Increase Docker memory allocation (Docker Desktop settings → Resources)
2. Or reduce pnpm lock count in Dockerfile

### Port Conflicts

If ports 3000, 3001, or 5432 are in use:

```bash
# Find what's using port 3000
lsof -i :3000

# Kill process (macOS)
kill -9 <PID>
```

Or edit `docker-compose.yml` port mappings.

## Additional Resources

- **CLAUDE.md** — Full architecture reference, data flow, styling details
- **apps/www/payload.config.ts** — Payload CMS configuration, collections, globals
- **apps/www/next.config.ts** — Next.js config, security headers, API rewrites
- **packages/config/src/** — Shared constants, URLs, locales
- **.env.example** — All environment variables

For contributor guidelines, code review, or deployment, see the main README.md.
