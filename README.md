# vision-aid-prototype-v1

This is a [Next.js](https://nextjs.org/) project bootstrapped
with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Run the app locally:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Development

Run commands from the root directory.

### 1. Start the local database

`docker-compose.local.yaml` runs MySQL 8.0.41 (matching production) and
**publishes a host port**, so `next dev` and the Prisma CLI can reach it from
the host. This is the file to use for local work — `docker-compose.ci.yaml`
also defines a `db`, but without a port mapping, so it is only reachable from
inside the compose network.

```bash
docker compose -f docker-compose.local.yaml up -d
```

| Setting  | Value                                          |
| -------- | ---------------------------------------------- |
| Host     | `localhost:3307` (override `LOCAL_DB_PORT`)    |
| User     | `root` / `root` (override `LOCAL_DB_PASSWORD`) |
| Database | `vision_local` (override `LOCAL_DB_NAME`)      |
| Volume   | `local-db-data` (survives restarts)            |

### 2. Point `.env` at it

> [!WARNING]
> `.env` ships with `DATABASE_URL` pointing at **remote staging**. Leave it that
> way and `prisma migrate dev`, `prisma migrate deploy`, and `next dev` will all
> operate on a shared remote database. Switch it before doing local work.

```
DATABASE_URL="mysql://root:root@localhost:3307/vision_local"
```

### 3. Load data

Either seed mock records (add yourself as a User with the relevant privileges in
`prisma/seed.js` first):

```bash
pnpm exec prisma migrate dev
pnpm exec prisma db seed
```

…or restore a production dump — see below.

### Restoring a production dump

Dumps are exported from phpMyAdmin and contain no `CREATE DATABASE`/`USE`
statement, so the target database is chosen at import time. A full dump takes
roughly 5–10 minutes to load.

```bash
docker exec -i va-partners-db mysql -uroot -proot \
  -e "DROP DATABASE IF EXISTS vision_local; CREATE DATABASE vision_local CHARACTER SET utf8mb4;"
docker exec -i va-partners-db mysql -uroot -proot vision_local < path/to/dump.sql
pnpm exec prisma migrate status   # confirm the dump's schema matches the repo
```

> [!CAUTION]
> Dumps contain beneficiary PII (names, phone numbers, dates of birth, medical
> records). `.gitignore` excludes `/*.sql` at the repo root — keep dumps there or
> outside the repo, and never commit one.

### Connecting and inspecting

```bash
docker exec -it va-partners-db mysql -uroot -proot vision_local
```

```sql
show tables;
describe <table name>;

-- The container enables the slow-query log at 0.5s for local profiling:
SELECT start_time, query_time, CONVERT(sql_text USING utf8) FROM mysql.slow_log
  ORDER BY start_time DESC LIMIT 20;
```

```bash
# Stop, keeping data
docker compose -f docker-compose.local.yaml down

# Clean slate (drops the volume)
docker compose -f docker-compose.local.yaml down -v
```

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed
on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited
in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated
as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and
load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions
are welcome!

## Deployment (Coolify + GHCR)

`.github/workflows/publish.yaml` runs on every push to `main` (and on manual
dispatch). It builds the image, pushes `ghcr.io/c4g/va-partners:latest` and
`:<commit-sha>`, then triggers a Coolify deployment of **va-partners-test**.

`docker-compose.yaml` references that published image and has **no `build:`
key**, which keeps the shared Coolify host from compiling the application on
every deploy — it only pulls and restarts. Coolify's git auto-deploy is off on
both applications, so the workflow is the single trigger and cannot race a
half-finished image push.

| Environment                | Coolify app        | Image tag                                 |
| -------------------------- | ------------------ | ----------------------------------------- |
| `va-partners-test.c4g.dev` | `va-partners-test` | `latest` (deployed automatically on main) |
| `va-partners.c4g.dev`      | `va-partners`      | `IMAGE_TAG` pinned to a commit SHA        |

**Promoting to production** is manual: set `IMAGE_TAG` to the commit SHA of a
build already verified on va-partners-test in the `va-partners` application's
Coolify environment variables, then redeploy. Production runs the exact image
that was tested — no rebuild.

Nothing environment-specific is baked into the image, so one build serves both.
Migrations are applied by `docker-entrypoint.sh` (`prisma migrate deploy`) when
the container starts, so there is no separate migration image.

Required configuration: `COOLIFY_TOKEN` (organization secret) and a
`COOLIFY_APP_UUID` repository variable pointing at va-partners-test. The deploy
step skips itself if either is missing.

### Building locally

```bash
docker compose -f docker-compose.yaml -f docker-compose.ci.yaml \
  -f docker-compose.build.yaml up --build -d
```

Note: the repo-root `.env` is auto-loaded by Docker Compose and may point
`DATABASE_URL` at a remote database. Pass `--env-file /dev/null` to force the
bundled MySQL from `docker-compose.ci.yaml`.

The compose files, for reference:

| File                        | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `docker-compose.yaml`       | Base. Published image, no `build:`, no database. Used by Coolify. |
| `docker-compose.local.yaml` | Local dev database only, published on a host port. Not deployed.  |
| `docker-compose.ci.yaml`    | Bundled MySQL for CI, network-internal only. Not deployed.        |
| `docker-compose.build.yaml` | Adds the `build:` key for building the image locally.             |

## Prisma

> [!CAUTION]
> **DO NOT MANUALLY CHANGE SCHEMA** - Create a migration instead - this ensures the schema/data is correct across staging/production database.

- [Prisma Getting Started](https://www.prisma.io/docs/getting-started) - learn how prisma operates and works
