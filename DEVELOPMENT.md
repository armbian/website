# Development Guide

## Prerequisites

- **Docker** with Compose v2
- **Git**
- **bash/zsh**

Everything else (Node.js, pnpm, build tools) runs inside containers.

## Getting Started

```bash
git clone https://github.com/armbian/armbian-site.git
cd armbian-site
cp .env.example .env
```

Generate the required secrets:

```bash
# POSTGRES_PASSWORD
openssl rand -hex 32

# PAYLOAD_SECRET
openssl rand -hex 32
```

Paste them into `.env`, then start:

```bash
./manage.sh up
```

Once healthy:
- **Website**: http://localhost:3000
- **CMS Admin**: http://localhost:3000/admin

The default admin password is generated randomly on first boot. Find it with:

```bash
docker compose logs www | grep "Default admin user created"
```

---

## Architecture

### Monorepo Layout

```
apps/
  api/                Fastify 5 REST API (boards, images, vendors, search)
  www/                Next.js 16 + Payload CMS 3 (SSR, 17 locales)

packages/
  schemas/            Zod schemas — single source of truth for types
  config/             URLs, constants, support tiers, locales
  api-client/         Typed HTTP client wrapping fetch()
  theme/              CSS variables + Tailwind preset
```

Turborepo + pnpm workspaces. All code runs in Docker containers.

### Data Flow

```
github.armbian.com (upstream JSON)
        ↓ syncs every 4h
    API: SyncService → Normalizer (Zod) → DataStore (in-memory + MiniSearch)
        ↓ server-side fetch
    www: getApiClient() → SSR pages

    Payload CMS (PostgreSQL) → announcements, pages, flash guides, changelogs
```

The API normalizes upstream data and serves it over REST. The www app fetches server-side only — the API is not exposed to the browser (except image routes).

Payload CMS stores editorial content in PostgreSQL. Server components query it directly via `getPayload({ config })`.

### Route Groups

CSS isolation between the website and Payload admin:

```
apps/www/src/app/
├── (frontend)/           Armbian website — imports globals.css (Tailwind)
│   └── [locale]/         i18n pages
└── (payload)/            Payload admin — uses its own CSS
    ├── admin/            Admin UI at /admin
    └── api/              Payload REST API
```

Tailwind's preflight would break Payload's form styles. Route groups keep them separate.

### Server vs Client Components

Pages are server components by default. Only interactive UI uses `'use client'`.

```typescript
// Server component — data fetching, translations
const t = await getTranslations();
const api = getApiClient();
const data = await api.boards.list();
```

```typescript
// Client component — interactivity only
'use client';
const t = useTranslations();
```

### Image Serving

All images are served through the API's image cache:

```
Browser → /api/v1/images/boards/480/slug.png → Next.js rewrite → API → CDN (cached locally)
```

URL helpers in `@armbian/config`:

```typescript
boardImageUrl('nanopi-r6s')     // → /api/v1/images/boards/480/nanopi-r6s.png
vendorLogoUrl('radxa')          // → /api/v1/images/vendors/480/radxa.png
partnerLogoUrl('spacemit')      // → /api/v1/images/partners/spacemit.png
```

Images are fetched from the CDN on first request and cached on disk. Subsequent requests serve from cache.

---

## Common Tasks

### Rebuild After Code Changes

```bash
./manage.sh rebuild www       # frontend only
./manage.sh rebuild api       # API only
./manage.sh rebuild           # everything
```

### Logs

```bash
./manage.sh logs              # all services
./manage.sh logs www          # specific service
```

### Shell Access

```bash
./manage.sh shell             # www container (default)
./manage.sh shell api         # API container
```

### Database

```bash
./manage.sh db                # psql prompt
./manage.sh db:backup         # dump to backups/
./manage.sh db:restore FILE   # restore a backup
```

### Reset Everything

```bash
./manage.sh reset             # wipes volumes, rebuilds from scratch
```

---

## Adding Content

### New Page

1. Create `apps/www/src/app/(frontend)/[locale]/my-page/page.tsx`
2. Add i18n keys to `apps/www/src/messages/en.json`
3. Sync keys to all 16 other locale files
4. `./manage.sh rebuild www`

### New Payload Collection

1. Create collection in `apps/www/src/payload/collections/`
2. Register in `apps/www/payload.config.ts`
3. Generate migration: `./manage.sh shell www` → `pnpm payload migrate:create`
4. Import migration in `apps/www/src/migrations/index.ts`
5. `./manage.sh rebuild www` — migrations apply automatically

### New i18n Keys

Source of truth: `apps/www/src/messages/en.json`

1. Add keys to `en.json`
2. Copy to all 16 other locale files with translated values
3. Server components: `const t = await getTranslations()`
4. Client components: `const t = useTranslations()`

All user-facing text must use translation keys — no hardcoded strings.

### New API Endpoint

1. Create route in `apps/api/src/routes/`
2. Register in `apps/api/src/server.ts`
3. Types go in `packages/schemas/`
4. `./manage.sh rebuild api`

---

## Key Rules

1. **All text uses i18n keys** — no hardcoded strings in UI
2. **All data comes from the API** — never hardcode board info, counts, or URLs
3. **URLs come from `@armbian/config`** — use `ARMBIAN_URLS`, `boardImageUrl()`, etc.
4. **Sanitize CMS HTML** — use `sanitizeCmsHtml()` before `dangerouslySetInnerHTML`
5. **Images go through the API** — use the URL helpers, never link to CDN directly

---

## Styling

Tailwind 4 with `@tailwindcss/typography`. Class-based dark mode.

### CSS Variables

```css
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

### Fluid Typography

`text-fluid-hero` through `text-fluid-xs` — scales with viewport via `clamp()`.

### Key Classes

| Class | Purpose |
|-------|---------|
| `hw-card` | Board cards with hover transform + glow |
| `hw-img` | Image zoom on card hover |
| `bento-card` | Glassmorphism panels |
| `terminal-glass` | Code block styling |
| `badge-platinum` | Shiny tier badge |
| `divider-glow` | Glowing horizontal divider |

Defined in `apps/www/src/app/(frontend)/globals.css`.

---

## Environment Variables

Copy `.env.example` to `.env`. All variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_PASSWORD` | **Yes** | — | Database password |
| `PAYLOAD_SECRET` | **Yes** | — | 64-char hex for Payload auth |
| `INTERNAL_API_KEY` | No | — | API key for external access |
| `DATA_SYNC_INTERVAL_MS` | No | `14400000` | Sync interval (4h) |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Extra CORS origins |
| `LOG_LEVEL` | No | `info` | API log level |
| `OIDC_CLIENT_ID` | No | — | Authentik OAuth2 client ID |
| `OIDC_CLIENT_SECRET` | No | — | Authentik OAuth2 secret |
| `OIDC_ISSUER_URL` | No | — | Authentik issuer URL |
| `OIDC_ALLOWED_DOMAINS` | No | — | Restrict OIDC to email domains |

Without `POSTGRES_PASSWORD` and `PAYLOAD_SECRET`, the stack won't start.

### OIDC Authentication (Authentik)

Leave `OIDC_*` variables empty for local email/password login. When set, Authentik groups map to Payload roles:

| Authentik Group | Payload Role |
|---|---|
| `armbian-admin` | admin |
| `armbian-maintainer` | maintainer |
| `armbian-editor` | editor |
| *(no match)* | editor |

Roles sync on every login. First login auto-creates the user.

---

## Troubleshooting

### No Styles

Rebuild www and hard-refresh the browser:

```bash
./manage.sh rebuild www
```

### Build Fails with "PAYLOAD_SECRET is required"

Build-phase detection issue. Check that `NEXT_PHASE` is set in the Dockerfile.

### Migration Stuck

```bash
./manage.sh shell www
cd /app/apps/www
pnpm payload migrate:up
```

Or restore from backup: `./manage.sh db:restore FILE`

### API 500 Errors

```bash
./manage.sh logs api
```

Common causes: upstream JSON changed format, Zod schema mismatch, rate limiting from GitHub.

### Port Conflicts

The www service uses port 3000. The API and PostgreSQL are internal only (no host ports). If 3000 is in use:

```bash
lsof -i :3000
kill -9 <PID>
```
