# Base image with Node.js
FROM node:24-alpine AS base

# Enable corepack and prepare pnpm (version pinned via package.json "packageManager")
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Build stage: install deps and produce the Next.js standalone output
FROM base AS builder
# libc6-compat + openssl are needed by the Prisma engines on Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# No build args on purpose: Next.js only inlines NEXT_PUBLIC_* vars that exist at
# build time, so leaving them unset keeps one image usable in every environment.

# Copy manifest + prisma schema first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma

# --ignore-scripts skips husky/prisma postinstall; build runs prisma generate. Cache mount persists the store across builds.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store

# Copy source code
COPY . .

# Generate the Prisma client (for the Alpine musl target) and build Next.js
RUN pnpm run build

# Production image: copy only what is needed and run the standalone server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# mariadb-connector-c is not optional: it supplies the caching_sha2_password plugin MySQL 8 authenticates with.
RUN apk add --no-cache openssl wget mariadb-client mariadb-connector-c

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# A named volume mounted here inherits this ownership, so the dump can be written as nextjs.
RUN mkdir -p /backups && chown nextjs:nodejs /backups

# Copy the standalone build output with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations, needed at runtime by `prisma migrate deploy`
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma CLI for `migrate deploy` (version matches @prisma/client); placed after COPY so it doesn't fight the builder for network.
RUN --mount=type=cache,target=/root/.npm npm install -g prisma@5.22.0

# Entrypoint applies pending migrations, then starts the server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
