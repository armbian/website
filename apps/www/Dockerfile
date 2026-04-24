FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate

FROM base AS build
WORKDIR /app

# Build-time public configuration. Next.js bakes NEXT_PUBLIC_* env vars
# into the client bundle during `next build`, so they must be set BEFORE
# the build command runs. Docker-compose passes them via build args.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING
ARG NEXT_PUBLIC_PRIMARY_DOMAIN
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING=${NEXT_PUBLIC_DOMAIN_LOCALE_ROUTING}
ENV NEXT_PUBLIC_PRIMARY_DOMAIN=${NEXT_PUBLIC_PRIMARY_DOMAIN}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/config/package.json ./packages/config/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/theme/package.json ./packages/theme/
COPY apps/www/package.json ./apps/www/
RUN pnpm install --frozen-lockfile
COPY . .
ENV API_URL=http://api:3001
RUN pnpm --filter @armbian/schemas build && \
    pnpm --filter @armbian/config build && \
    pnpm --filter @armbian/api-client build && \
    pnpm --filter @armbian/theme build && \
    pnpm --filter @armbian/www build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 appuser

COPY --from=build --chown=appuser:appgroup /app/apps/www/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/apps/www/.next/static ./apps/www/.next/static
COPY --from=build --chown=appuser:appgroup /app/apps/www/public ./apps/www/public

# Pre-create the media upload target with the right ownership so the
# named volume `media-uploads`, which is mounted over this path at
# runtime, inherits appuser:appgroup instead of defaulting to root:root.
# Without this, Payload cannot write uploaded files (EACCES).
RUN mkdir -p /app/apps/www/media && chown -R 1001:1001 /app/apps/www/media

USER appuser
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/www/server.js"]
