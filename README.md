# Armbian Website

Official website for Armbian — a Linux distribution for ARM single-board computers.
Built as a Turborepo monorepo with a Next.js 16 frontend, Fastify 5 REST API, and Payload CMS 3 editorial layer.

---

## Architecture

The repository is a **pnpm workspace / Turborepo monorepo** containing two applications and four shared packages.

### Applications

| App | Tech | Purpose |
|-----|------|---------|
| `apps/api` | Fastify 5, Node 22 | REST API serving board, image, vendor, and partner data from an in-memory store |
| `apps/www` | Next.js 16 App Router, React 19, Payload CMS 3, Tailwind 4 | Public website with SSR, 17-locale i18n, and CMS admin panel |

### Shared packages

| Package | Name | Purpose |
|---------|------|---------|
| `packages/schemas` | `@armbian/schemas` | Zod schemas — single source of truth for all data types |
| `packages/config` | `@armbian/config` | Constants, URLs, support tiers, OS metadata, locale list |
| `packages/api-client` | `@armbian/api-client` | TypeScript HTTP client wrapping `fetch()` |
| `packages/theme` | `@armbian/theme` | CSS custom properties and Tailwind preset |

### Data flow

Upstream JSON from `github.armbian.com` is fetched every 4 hours by `SyncService`, validated through Zod schemas in the `Normalizer`, and held in `DataStore` (in-memory map with MiniSearch full-text index). The API serves this data over HTTP. The `www` app consumes it server-side via `getApiClient()`.

Payload CMS stores editorial content in PostgreSQL and is queried directly in server components via `getPayload({ config })`. Database migrations run automatically on container startup.

### Route groups

The `www` app uses Next.js route groups to isolate Tailwind CSS from Payload's admin styles:

```
apps/www/src/app/
├── layout.tsx                    # Root layout — returns children only (no HTML shell)
├── (frontend)/                   # Armbian public website
│   ├── layout.tsx                # Fonts + globals.css import
│   ├── globals.css               # Tailwind + Armbian theme
│   └── [locale]/                 # i18n pages
│       └── layout.tsx            # HTML shell, Navbar, Footer, Announcements
└── (payload)/                    # Payload CMS admin panel
    ├── layout.tsx                # Payload's own HTML shell + CSS
    ├── admin/[[...segments]]/    # Admin UI at /admin
    └── api/[...slug]/            # Payload REST API
```

---

## Quick Start

**Prerequisites:** Docker Engine with Compose v2 (`docker compose version`).

```bash
# 1. Copy and fill in the environment file
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and PAYLOAD_SECRET at minimum

# 2. Build and start the stack
./manage.sh up
```

The script validates `.env`, builds all images, starts all services, and waits for health checks to pass.

On first run the API fetches board and image data from `github.armbian.com`. The `www` service at `http://localhost:3000` will be ready once all three health checks are green. The Payload admin panel is at `http://localhost:3000/admin`.

---

## Management Commands

All operations go through `manage.sh`. Raw `docker compose` commands work too but the script adds validation, health-check polling, and confirmation prompts for destructive operations.

| Command | Description |
|---------|-------------|
| `./manage.sh up` | Build and start all services; wait for health checks |
| `./manage.sh down` | Stop all services (volumes preserved) |
| `./manage.sh reset` | Stop all, wipe volumes (database + cache), rebuild from scratch |
| `./manage.sh rebuild [service]` | Rebuild one service (`www`, `api`) or all if unspecified |
| `./manage.sh logs [service]` | Follow logs for one service or all |
| `./manage.sh status` | Show container status, health states, and HTTP endpoint checks |
| `./manage.sh shell [service]` | Open a shell inside a container (defaults to `www`) |
| `./manage.sh db` | Open a `psql` session in the running postgres container |
| `./manage.sh db:backup` | Dump the database to `backups/` with a timestamp (gzipped) |
| `./manage.sh db:restore <file>` | Restore a `.sql` or `.sql.gz` backup file |
| `./manage.sh clean` | Remove Docker images, volumes, and build cache (with confirmation) |
| `./manage.sh env` | Validate `.env` file and all required variables |
| `./manage.sh help` | Show the help message |

**Examples:**

```bash
./manage.sh rebuild www
./manage.sh logs api
./manage.sh db:backup
./manage.sh db:restore backups/payload_20260101_120000.sql.gz
./manage.sh shell api
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values before running the stack.

### API service

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATA_SYNC_INTERVAL_MS` | `14400000` | No | Board/image data sync interval in milliseconds (default 4 h) |
| `CORS_ORIGINS` | `http://localhost:3000` | No | Comma-separated origins added to the API CORS allow-list |
| `PUBLIC_API_URL` | `http://localhost:3001` | No | Publicly reachable API base URL (used by the www app) |
| `LOG_LEVEL` | `info` | No | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |

### PostgreSQL

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `POSTGRES_DB` | `payload` | No | Database name |
| `POSTGRES_USER` | `payload` | No | Database user |
| `POSTGRES_PASSWORD` | — | **Yes** | Database password. Compose exits without this. |

### Payload CMS

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PAYLOAD_SECRET` | — | **Yes** | 64-character hex secret for Payload auth. Compose exits without this. |

### OIDC (optional)

Leave all four variables empty to use Payload's built-in local username/password login.

| Variable | Description |
|----------|-------------|
| `OIDC_CLIENT_ID` | OAuth2 client ID (e.g. from Authentik) |
| `OIDC_CLIENT_SECRET` | OAuth2 client secret |
| `OIDC_ISSUER_URL` | OIDC issuer URL (e.g. `https://auth.yourdomain.com/application/o/armbian`) |
| `OIDC_ALLOWED_DOMAINS` | Comma-separated email domains allowed to log in via OIDC |

---

## Project Structure

```
.
├── apps/
│   ├── api/                      # Fastify 5 REST API
│   │   ├── src/
│   │   │   ├── server.ts         # Entry point
│   │   │   ├── routes/           # boards, vendors, search, images, health, stats, ...
│   │   │   └── services/         # SyncService, DataStore, Normalizer, ImageCache
│   │   └── Dockerfile
│   └── www/                      # Next.js 16 + Payload CMS 3
│       ├── src/
│       │   ├── app/              # Next.js App Router (route groups)
│       │   ├── components/       # React components
│       │   ├── i18n/             # next-intl routing configuration
│       │   ├── lib/              # Utilities (sanitize, api client wrappers)
│       │   ├── messages/         # Translation files (en.json is source of truth)
│       │   ├── migrations/       # Payload database migrations
│       │   └── payload/          # Collections, globals, access control
│       ├── payload.config.ts     # Payload CMS configuration
│       └── Dockerfile
├── packages/
│   ├── api-client/               # @armbian/api-client — typed HTTP client
│   ├── config/                   # @armbian/config — URLs, locales, support tiers, OS metadata
│   ├── schemas/                  # @armbian/schemas — Zod type definitions
│   └── theme/                    # @armbian/theme — CSS variables, Tailwind preset
├── manage.sh                     # Management script for the Docker stack
├── docker-compose.yml
├── .env.example
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## i18n

The website supports 17 locales via `next-intl`.

| Code | Language | Notes |
|------|----------|-------|
| `en` | English | Default locale — no URL prefix |
| `de` | Deutsch | Also forced for `armbian.de` |
| `zh` | 中文 | Also forced for `armbian.cn` |
| `fr` | Français | |
| `es` | Español | |
| `it` | Italiano | |
| `ru` | Русский | |
| `pt` | Português | |
| `ja` | 日本語 | |
| `ko` | 한국어 | |
| `nl` | Nederlands | |
| `pl` | Polski | |
| `tr` | Türkçe | |
| `uk` | Українська | |
| `hr` | Hrvatski | |
| `sl` | Slovenščina | |
| `sv` | Svenska | |

URL prefix strategy: `as-needed` — the default locale (`en`) has no prefix; all others use `/{locale}/`.

**Adding or updating translations:**

1. Add the new key to `apps/www/src/messages/en.json` (source of truth).
2. Add the same key to all 16 other locale files under the same path.
3. Use `getTranslations()` in server components and `useTranslations()` in client components.
4. Never use hardcoded strings in user-facing UI — all text must reference a translation key.

---

## CMS

Payload CMS 3 runs embedded inside the `www` container. The admin panel is at `/admin`.

### Collections

| Slug | Purpose |
|------|---------|
| `users` | Authentication with RBAC (roles: `admin`, `editor`, `maintainer`) |
| `media` | Image uploads — PNG, JPEG, WebP |
| `flash-guides` | Per-board installation guides (keyed by locale + board slug) |
| `announcements` | Top-banner notifications with type and optional expiry |
| `pages` | Static CMS pages served at `/p/{slug}` |
| `changelogs` | Release notes served at `/changelogs` |

### Globals

| Slug | Purpose |
|------|---------|
| `company-config` | Company info, VAT number, IBAN, Calendly URLs |

### Access control

Access rules are defined in `apps/www/src/payload/access.ts`. Maintainers may only edit flash guides for boards assigned to them. OIDC login (Authentik) is activated by setting the four `OIDC_*` environment variables; leave them empty for local email/password login.

### Adding a collection

1. Create the collection file in `apps/www/src/payload/collections/`.
2. Register it in `apps/www/payload.config.ts`.
3. Generate a migration (requires a running database): `npx payload migrate:create NAME`
4. Import the migration in `apps/www/src/migrations/index.ts`.
5. Restart the `www` container — Payload applies pending migrations automatically on startup.

---

## Deployment

The stack is three Docker Compose services.

| Service | Image | Port | Depends on |
|---------|-------|------|------------|
| `api` | Built from `apps/api/Dockerfile` | `127.0.0.1:3001` | — |
| `postgres` | `postgres:17-alpine` | Internal only | — |
| `www` | Built from `apps/www/Dockerfile` | `127.0.0.1:3000` | `api` (healthy), `postgres` (healthy) |

Ports are bound to `127.0.0.1`. Place a reverse proxy (e.g. Caddy or Nginx) in front of port `3000` for public HTTPS access.

**Requirements:**

- Docker Engine with Compose v2
- `POSTGRES_PASSWORD` set in `.env` — Compose will not start without it
- `PAYLOAD_SECRET` set in `.env` — Compose will not start without it

**Build-time secret handling:**

The `www` Dockerfile requires no secrets at build time. `payload.config.ts` detects `NEXT_PHASE=phase-production-build` and substitutes placeholder values during `next build`. Real secrets are injected at container runtime via Docker Compose environment variables.

**Database migrations:**

Payload applies all pending migrations automatically when the `www` container starts, using `prodMigrations` in the Postgres adapter configuration. No manual migration step is required.

**Health checks:**

All three services expose Docker health checks. The `www` service will not start until both `api` and `postgres` report healthy. Use `./manage.sh status` to inspect the current state of the stack.

**Data persistence:**

| Volume | Contents |
|--------|---------|
| `api-cache` | Disk cache for board/image data (survives restarts, cleared by `reset`) |
| `postgres-data` | PostgreSQL database files (survives restarts, cleared by `reset`) |

---

## License

GPL-2.0. See the [Armbian build repository](https://github.com/armbian/build) for license terms.
