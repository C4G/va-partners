#!/bin/sh
# Container entrypoint: apply pending Prisma migrations, then hand off to the
# Next.js standalone server (the image CMD). Replaces the "Apply Prisma
# Migrations" step that previously ran in the Vercel GitHub Action.
#
# The database may not be accepting connections at the exact moment the
# container starts (e.g. a MySQL first-run initialization, or a managed DB
# that is briefly failing over), so connection errors are retried. Any other
# migration failure aborts so it is surfaced rather than silently looped.
set -e

SCHEMA=./prisma/schema.prisma
ATTEMPTS=30
i=1

while [ "$i" -le "$ATTEMPTS" ]; do
  echo "[entrypoint] Applying Prisma migrations (attempt $i/$ATTEMPTS)..."
  if out=$(prisma migrate deploy --schema "$SCHEMA" 2>&1); then
    echo "$out"
    echo "[entrypoint] Migrations applied. Starting server..."
    exec "$@"
  fi
  echo "$out"
  if echo "$out" | grep -q "P1001"; then
    echo "[entrypoint] Database not reachable yet; retrying in 2s..."
    i=$((i + 1))
    sleep 2
    continue
  fi
  echo "[entrypoint] Migration failed with a non-connection error; aborting."
  exit 1
done

echo "[entrypoint] Database never became reachable after $ATTEMPTS attempts; aborting."
exit 1
