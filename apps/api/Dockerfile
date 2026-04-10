FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate

# Full monorepo install + build in one stage
FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @armbian/schemas build && \
    pnpm --filter @armbian/config build && \
    pnpm --filter @armbian/api build
# Prune to production deps only
RUN pnpm --filter @armbian/api deploy --prod /app/pruned

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 appgroup && adduser --system --uid 1001 appuser

COPY --from=build /app/pruned/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/data ./data
COPY --from=build /app/apps/api/package.json ./package.json
RUN mkdir -p /app/cache /app/shared/caddy && chown -R 1001:1001 /app/cache /app/shared

USER appuser
EXPOSE 3001
CMD ["node", "dist/server.js"]
