#!/bin/sh
# Apply pending Prisma migrations (retrying while the DB is unreachable), then start the server.
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
