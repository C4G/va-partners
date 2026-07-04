# Base image with Node.js
FROM node:24-alpine AS base

# Enable corepack and prepare pnpm (version pinned via package.json "packageManager")
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Build stage: install deps and produce the Next.js standalone output
FROM base AS builder
# libc6-compat + openssl are needed by the Prisma engines on Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Declare build arguments for Next.js public variables (inlined at build time)
ARG NEXT_PUBLIC_NEXTAUTH_URL

# Set environment variables from build args (baked into the client bundle)
ENV NEXT_PUBLIC_NEXTAUTH_URL=$NEXT_PUBLIC_NEXTAUTH_URL

# Copy manifest + prisma schema first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma

# Install dependencies. --ignore-scripts skips husky's prepare hook and the
# prisma postinstall; the build step below runs `prisma generate` explicitly.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate the Prisma client (for the Alpine musl target) and build Next.js
RUN pnpm run build

# Production image: copy only what is needed and run the standalone server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# openssl for Prisma engines, wget for the container healthcheck
RUN apk add --no-cache openssl wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install the Prisma CLI so the entrypoint can run `prisma migrate deploy`.
# Pinned to match the @prisma/client version resolved in pnpm-lock.yaml.
RUN npm install -g prisma@5.22.0

# Copy the standalone build output with correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations, needed at runtime by `prisma migrate deploy`
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Entrypoint applies pending migrations, then starts the server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
