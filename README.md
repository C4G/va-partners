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

Run commands from root directory

Start a mysql server container

```
docker compose up -d --force-recreate
```

Update .env

```
DATABASE_URL="mysql://root:root@localhost:3306/vision"
```

Add yourself as User with relevant privledges to seed.js

Migrate/apply schema and seed mock records into database

```
npx prisma migrate dev
npx prisma db seed
```

Connect to mysql server to verify migration and seed and test API changes

docker exec -it vision-aid-prototype-v1-db-1 mysql -u root -p

Enter "root" when prompted for password.

Helpful Commands:

mysql

```
use vision;
show tables;
describe <table name>;
<SQL queries>;
```

docker

```
# Database Clean Slate
docker compose down -v
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

## Prisma

> [!CAUTION]
> **DO NOT MANUALLY CHANGE SCHEMA** - Create a migration instead - this ensures the schema/data is correct across staging/production database.

- [Prisma Getting Started](https://www.prisma.io/docs/getting-started) - learn how prisma operates and works
