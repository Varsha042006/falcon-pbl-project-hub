# Deployment Guide

## Common environment variables

- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET`: long random secret; changing it signs out all users.
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_INSTITUTION`

Run migrations and seed only once for a new environment:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run build
npm start
```

## Vercel

1. Push the repository to GitHub/GitLab.
2. Import it in Vercel.
3. Provision any externally reachable PostgreSQL database with connection pooling suitable for serverless use.
4. Add environment variables.
5. Run `npm run db:migrate` from a controlled CI job or administration machine before releasing schema-dependent code.
6. Deploy.

Do not run seeds on every deployment.

## Render

`render.yaml` defines a web service and PostgreSQL database. After the first service creation:

1. Open a Render shell or use a one-off job.
2. Run `npm run db:migrate`.
3. Run `npm run db:seed` only for the first installation.
4. Redeploy the web service.

## University server using Docker

Requirements: Docker Engine and Docker Compose.

```bash
git clone <repository>
cd falcon-pbl-project-hub
cp .env.example .env
# Replace all secrets and database values.
docker compose up -d db
npm ci
npm run db:migrate
npm run db:seed
docker compose up -d --build web
```

Place Nginx, Apache or a university load balancer in front of port 3000 and terminate HTTPS there.

## Traditional Node.js server

Install Node.js 22+, PostgreSQL and a process manager such as systemd or PM2. Run `npm ci`, migrations, build and `npm start`. Configure a reverse proxy and HTTPS.

## Health verification

- Home page returns HTTP 200.
- Public projects load.
- Login succeeds.
- Supervisor can create a test team.
- Student can apply.
- Faculty can accept/reject.
- Accepted allocation appears publicly.
