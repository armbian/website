FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate

FROM base AS build
WORKDIR /app

# Build-time public configuration. Next.js bakes NEXT_PUBLIC_* env vars
# into the client bundle during `next build`, so they must be set BEFORE
# the build command runs. Docker-compose passes them via build args.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/config/package.json ./packages/config/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/theme/package.json ./packages/theme/
COPY apps/imager/package.json ./apps/imager/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @armbian/schemas build && \
    pnpm --filter @armbian/config build && \
    pnpm --filter @armbian/api-client build && \
    pnpm --filter @armbian/theme build && \
    pnpm --filter @armbian/imager build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 appuser

COPY --from=build --chown=appuser:appgroup /app/apps/imager/.next/standalone ./
COPY --from=build --chown=appuser:appgroup /app/apps/imager/.next/static ./apps/imager/.next/static
COPY --from=build --chown=appuser:appgroup /app/apps/imager/public ./apps/imager/public

USER appuser
EXPOSE 3002
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/imager/server.js"]
