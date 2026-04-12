<h3 align="center">
  <a href="https://www.armbian.com"><img src="https://raw.githubusercontent.com/armbian/.github/master/profile/logosmall.png" alt="Armbian logo"></a>
  <br><br>
</h3>

## Purpose of This Repository

The **Armbian Website** is the official web platform for the Armbian project — serving board information, download links, community resources, and editorial content for hundreds of ARM single-board computers.

It's built as a monorepo with a **Next.js 16** frontend, **Fastify 5** REST API, and **Payload CMS 3** for content management. Board and image data is synced automatically from upstream Armbian infrastructure.

> **Looking for the build framework?** See [armbian/build](https://github.com/armbian/build) — the tool that compiles Armbian images from source.

## Quick Start

**Prerequisites:** Docker Engine with Compose v2.

```bash
git clone https://github.com/armbian/armbian-site.git
cd armbian-site
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and PAYLOAD_SECRET

./manage.sh up
```

The site is available at `http://localhost`. The CMS admin panel is at `http://localhost/admin`. The API is exposed at `http://localhost:8080/api/v1/` for Imager and third-party clients.

## Architecture

| Component             | Tech                                            | Purpose                                              |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| `apps/www`            | Next.js 16, React 19, Payload CMS 3, Tailwind 4 | Public website — SSR, 17 locales, CMS admin          |
| `apps/api`            | Fastify 5, Node 22                              | REST API — boards, images, vendors, partners, search |
| `packages/schemas`    | Zod                                             | Shared type definitions and validation               |
| `packages/config`     | TypeScript                                      | URLs, constants, support tiers, locale config        |
| `packages/api-client` | TypeScript                                      | Typed HTTP client for the API                        |
| `packages/theme`      | CSS / Tailwind                                  | Design tokens and Tailwind preset                    |

### How Data Flows

```
github.armbian.com (upstream JSON)
        ↓ syncs every 4h
    Fastify API (in-memory store + MiniSearch index)
        ↓ server-side fetch
    Next.js (SSR pages)
        ↓
    Browser

    Payload CMS (PostgreSQL) → editorial content (announcements, pages, flash guides)
```

## Management

All operations go through `manage.sh`:

| Command                         | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `./manage.sh up`                | Build, start, and wait for health checks         |
| `./manage.sh deploy`            | Pull pre-built GHCR images and restart           |
| `./manage.sh down`              | Stop all services (data preserved)               |
| `./manage.sh rebuild [service]` | Rebuild one or all services                      |
| `./manage.sh reset`             | Stop, wipe volumes, rebuild from scratch         |
| `./manage.sh status`            | Container health and endpoint checks             |
| `./manage.sh logs [service]`    | Follow logs                                      |
| `./manage.sh quality [check]`   | Run typecheck + test in Docker (lint, format...) |
| `./manage.sh db:backup`         | Dump database to `backups/`                      |
| `./manage.sh db:restore <file>` | Restore a backup                                 |
| `./manage.sh cache:clean`       | Wipe pnpm store and node_modules volumes         |
| `./manage.sh shell [service]`   | Open a shell in a container                      |

Run `./manage.sh help` for the full list.

`./manage.sh up` builds images locally from source. `./manage.sh deploy` pulls pre-built images from GHCR -- use this on production servers where you don't want to compile.

## CI/CD Pipeline

Three GitHub Actions workflows form a gated pipeline:

| Workflow | Trigger | Purpose |
|---|---|---|
| **CI** (`ci.yml`) | Push/PR to `main` | Typecheck + test |
| **Release** (`release.yml`) | Tag `v*.*.*` | CI gate, build multi-arch Docker images, push to GHCR, create GitHub Release |
| **Deploy** (`deploy.yml`) | Release completes (or manual) | SSH into production, `git checkout <tag>`, `./manage.sh deploy` |

To release: tag a commit (`git tag v0.5.0 && git push --tags`). CI runs first; if it passes, Docker images are built for `linux/amd64` and `linux/arm64`, pushed to `ghcr.io/armbian/website/{api,www}`, and a GitHub Release with auto-generated notes is created. The deploy workflow then pulls the new images on the server.

Required GitHub secrets for deploy: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_KEY` (SSH private key), `GHCR_TOKEN`.

## Deployment

Four Docker Compose services:

| Service    | Port                | Notes                                                              |
| ---------- | ------------------- | ------------------------------------------------------------------ |
| `caddy`    | `80`, `443`, `8080` | Reverse proxy — automatic HTTPS when real domains are set          |
| `www`      | Internal only       | Next.js app reached through Caddy                                  |
| `api`      | Internal only       | Fastify API reached through Caddy (port 8080 for external clients) |
| `postgres` | Internal only       | Data persisted in Docker volume                                    |

Required environment variables: `POSTGRES_PASSWORD`, `PAYLOAD_SECRET`. For production, set `WWW_HOSTNAME`, `API_HOSTNAME`, and `CADDY_EMAIL` to enable automatic TLS. See `.env.example` for all options.

The `docker-compose.yml` includes `image:` references to GHCR. When you run `./manage.sh deploy`, Compose pulls the pre-built images instead of building locally. When you run `./manage.sh up`, Compose uses the `build:` directive and compiles from source.

Payload migrations run automatically on startup — no manual steps needed.

## Internationalization

17 locales via `next-intl`: English (default), German, Chinese, French, Spanish, Italian, Russian, Portuguese, Japanese, Korean, Dutch, Polish, Turkish, Ukrainian, Croatian, Slovenian, Swedish.

Domain forcing: `armbian.cn` → Chinese, `armbian.de` → German. The language switcher redirects cross-domain on the official deployment. Self-hosted instances keep all locales on a single host unless `NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING=true` is set (build-time env var, baked into the client bundle).

## Resources

- **[Documentation](https://docs.armbian.com)** — Armbian guides and references
- **[Website](https://www.armbian.com)** — Live site
- **[Blog](https://blog.armbian.com)** — Development updates
- **[Forums](https://forum.armbian.com)** — Community support

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for the full developer guide — architecture details, code conventions, adding collections, i18n workflow, and more.

## Support

### Community

Get help on the [Armbian Forums](https://forum.armbian.com) or join [Discord](https://discord.armbian.com).

### Commercial

For partnerships, integrations, or paid support — [contact us](https://www.armbian.com/contact).

## Armbian Partners

Our [partnership program](https://forum.armbian.com/subscriptions) supports Armbian's development and community. Learn more about [our partners](https://www.armbian.com/partners).

## License

GPL-2.0. See the [Armbian build repository](https://github.com/armbian/build) for license terms.
