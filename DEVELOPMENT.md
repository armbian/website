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

- **Website**: http://localhost
- **CMS Admin**: http://localhost/admin
- **API (external)**: http://localhost:8080/api/v1/

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
  imager/             Next.js 16 standalone — imager.armbian.com landing page

packages/
  schemas/            Zod schemas — single source of truth for types
  config/             URLs, constants, support tiers, locales
  api-client/         Typed HTTP client wrapping fetch()
  theme/              CSS variables + Tailwind preset
```

The `imager` app consumes the same API as `www` via `@armbian/api-client`
(method `apiClient.getBoards()` for the demo manufacturer carousel and
`apiClient.getImagerRepo()` for the GitHub release info — proxied
through `/api/v1/imager/repo`). It does not depend on Payload, Postgres,
or any locale infrastructure.

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
boardImageUrl('nanopi-r6s'); // → /api/v1/images/boards/480/nanopi-r6s.png
vendorLogoUrl('radxa'); // → /api/v1/images/vendors/480/radxa.png
partnerLogoUrl('spacemit'); // → /api/v1/images/partners/spacemit.png
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

### Quality Checks

```bash
./manage.sh quality           # typecheck + test (inside Docker)
./manage.sh quality typecheck # typecheck only
./manage.sh quality test      # test only
./manage.sh quality lint      # lint only
./manage.sh quality format    # format check only
```

Runs in a one-shot Node 22 container with the project mounted at `/app`. No local `node_modules` required.

### Deploy (Production)

```bash
./manage.sh deploy            # pull GHCR images, restart, wait for health
```

Unlike `./manage.sh up` (which builds from source), `deploy` pulls pre-built images from `ghcr.io/armbian/website/{api,www}`. Use this on production servers. If `GHCR_TOKEN` is set in `.env` or the environment, it authenticates to GHCR before pulling.

### Reset Everything

```bash
./manage.sh reset             # wipes volumes, rebuilds from scratch
```

### Cache Management

```bash
./manage.sh cache:clean       # wipe pnpm store + named node_modules volumes
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

| Class            | Purpose                                 |
| ---------------- | --------------------------------------- |
| `hw-card`        | Board cards with hover transform + glow |
| `hw-img`         | Image zoom on card hover                |
| `bento-card`     | Glassmorphism panels                    |
| `terminal-glass` | Code block styling                      |
| `badge-platinum` | Shiny tier badge                        |
| `divider-glow`   | Glowing horizontal divider              |

Defined in `apps/www/src/app/(frontend)/globals.css`.

---

## Environment Variables

Copy `.env.example` to `.env`. All variables:

| Variable                            | Required | Default                 | Description                              |
| ----------------------------------- | -------- | ----------------------- | ---------------------------------------- |
| `POSTGRES_PASSWORD`                 | **Yes**  | —                       | Database password                        |
| `PAYLOAD_SECRET`                    | **Yes**  | —                       | 64-char hex for Payload auth             |
| `DATA_SYNC_INTERVAL_MS`             | No       | `14400000`              | Sync interval (4h)                       |
| `CORS_ORIGINS`                      | No       | `http://localhost:3000` | Extra CORS origins                       |
| `LOG_LEVEL`                         | No       | `info`                  | API log level                            |
| `NEXT_PUBLIC_SITE_URL`              | No       | —                       | Base URL for Open Graph absolute URLs    |
| `NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING` | No       | `false`                 | Enable cross-domain locale switching     |
| `WP_CONTENT_DIR`                    | No       | `./legacy/wp-content`   | Host path for legacy `/wp-content` files |
| `OIDC_CLIENT_ID`                    | No       | —                       | Authentik OAuth2 client ID               |
| `OIDC_CLIENT_SECRET`                | No       | —                       | Authentik OAuth2 secret                  |
| `OIDC_ISSUER_URL`                   | No       | —                       | Authentik issuer URL                     |
| `OIDC_ALLOWED_DOMAINS`              | No       | —                       | Restrict OIDC to email domains           |

Without `POSTGRES_PASSWORD` and `PAYLOAD_SECRET`, the stack won't start.

`NEXT_PUBLIC_*` variables are baked into the Next.js client bundle at build time. They are passed as Docker build args in `docker-compose.yml` and in the release workflow. Changing them requires a rebuild (`./manage.sh rebuild www`) or a new release tag.

### OIDC Authentication (Authentik)

Leave `OIDC_*` variables empty for local email/password login. When set, Authentik groups map to Payload roles:

| Authentik Group      | Payload Role |
| -------------------- | ------------ |
| `armbian-admin`      | admin        |
| `armbian-maintainer` | maintainer   |
| `armbian-editor`     | editor       |
| _(no match)_         | editor       |

Roles sync on every login. First login auto-creates the user.

---

## CI/CD Pipeline

Three GitHub Actions workflows:

1. **CI** (`.github/workflows/ci.yml`) -- runs on push/PR to `main`. Installs deps, runs `pnpm typecheck` and `pnpm test`.
2. **Release** (`.github/workflows/release.yml`) -- triggered by version tags (`v*.*.*`). Runs CI first, then builds multi-arch Docker images (`linux/amd64`, `linux/arm64`) and pushes them to GHCR (`ghcr.io/armbian/website/api`, `ghcr.io/armbian/website/www`). Creates a GitHub Release with auto-generated notes.
3. **Deploy** (`.github/workflows/deploy.yml`) -- triggered automatically when the Release workflow completes, or manually via `workflow_dispatch`. SSHs into the production server, checks out the tag, and runs `./manage.sh deploy`.

### Release Flow

```
git tag v0.5.0 && git push --tags
    → CI (typecheck + test)
    → Build (Docker images → GHCR)
    → Release (GitHub Release notes)
    → Deploy (SSH → ./manage.sh deploy)
```

### Required GitHub Secrets

| Secret        | Purpose                                       |
| ------------- | --------------------------------------------- |
| `DEPLOY_HOST` | Production server hostname/IP                 |
| `DEPLOY_USER` | SSH username                                  |
| `DEPLOY_KEY`  | SSH private key                               |
| `GHCR_TOKEN`  | GitHub token for pulling images on the server |

`GITHUB_TOKEN` is used automatically for GHCR push during the build job.

---

## Multi-Domain Locale Routing

The official Armbian deployment serves three domains:

| Domain        | Locale    | Behavior                                              |
| ------------- | --------- | ----------------------------------------------------- |
| `armbian.com` | all 17    | Default English, other locales via `/<locale>` prefix |
| `armbian.cn`  | `zh` only | Forces Chinese on every page                          |
| `armbian.de`  | `de` only | Forces German on every page                           |

This is configured in `packages/config/src/locales.ts` (`DOMAIN_LOCALE_MAP`) and `apps/www/src/i18n/routing.ts`.

`DOMAIN_LOCALE_MAP` only contains apex hostnames. The `www.` variants of these domains must be 301'd to their apex at the edge, otherwise next-intl won't match the Host header and the page falls back to English. Caddy handles this via `WWW_REDIRECT_HOSTS` (see below).

The language switcher (`language-switcher.tsx`) cross-redirects between domains only when **both** conditions are met:

1. `NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING=true` (build-time env var)
2. The current browser hostname matches a known Armbian domain

Self-hosted instances and local development always use in-place locale switching via `/<locale>` prefixes, regardless of this setting.

### Canonical host redirects (`WWW_REDIRECT_HOSTS`)

Caddy reads `WWW_REDIRECT_HOSTS` (comma-separated hostnames) and 301's each one to its apex, preserving path and query. Typical production value:

```
WWW_REDIRECT_HOSTS=www.armbian.com, www.armbian.cn, www.armbian.de
```

Leave unset in dev — the default placeholder (`:0`) binds the block to an ephemeral port with no listener, effectively disabling it. DNS for each listed hostname must point at the Caddy instance so TLS certificates can be obtained automatically.

---

## Contact Form and reCAPTCHA

The contact page submits to Zoho Bigin via a hidden iframe (`biginHiddenFrame`). A Google reCAPTCHA v2 widget gates submission.

### Configuration

- **Site key**: `RECAPTCHA_SITE_KEY` in `packages/config/src/urls.ts` (public, baked into the bundle)
- **Secret key**: configured on the Zoho Bigin side (not in this repo)
- **Bigin form tokens**: `BIGIN_FORM_TOKENS` in `packages/config/src/urls.ts`

### CSP Directives

The reCAPTCHA integration requires these CSP entries in `apps/www/next.config.ts`:

- `script-src`: `https://www.google.com/recaptcha/` and `https://www.gstatic.com/recaptcha/`
- `frame-src`: `https://www.google.com/recaptcha/`
- `connect-src`: `https://www.google.com`
- `img-src`: `https://www.gstatic.com/recaptcha/`

If the reCAPTCHA widget fails to render, check browser console for CSP violations.

---

## Legacy wp-content

Caddy serves files at `/wp-content/*` for legacy WordPress URLs that are still linked from external sites. This only applies to requests with `Host: armbian.com` or `Host: www.armbian.com`.

### Setup

1. Set `WP_CONTENT_DIR` in `.env` to the host path containing the legacy files (e.g., `/srv/wp-content`)
2. The directory is bind-mounted read-only into the Caddy container at `/srv/wp-content`
3. If unset, it defaults to `./legacy/wp-content` (empty placeholder, gitignored)

The Caddy matcher is in `docker/caddy/Caddyfile` -- it only triggers for the two production hostnames.

---

## Production Deploy Setup

### Server Prerequisites

1. Docker Engine with Compose v2
2. Git
3. The repository cloned at `/home/website` (or adjust `deploy.yml`)
4. A `.env` file with production values

### First Deploy

```bash
git clone https://github.com/armbian/armbian-site.git /home/website
cd /home/website
cp .env.example .env
# Fill in POSTGRES_PASSWORD, PAYLOAD_SECRET, WWW_HOSTNAME, etc.
./manage.sh up     # first time: build from source
```

### Subsequent Deploys

Handled automatically by the Deploy workflow, or manually:

```bash
cd /home/website
git fetch --all --tags
git checkout v0.5.0
./manage.sh deploy
```

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
lsof -i :80
kill -9 <PID>
```
