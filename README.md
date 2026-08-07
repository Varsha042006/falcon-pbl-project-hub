# Falcon PBL Project Hub

A provider-neutral web platform for project idea publishing, supervisor-based team formation, Team-ID-based project applications, faculty decisions, and public allocation transparency.

**Branding:** Falcon Bakes, Department of CSE, School of Computer Science and Technology, Faculty of Engineering and Technology, GM University, Davanagere.

## V1 capabilities

- Public project catalogue, team directory, faculty directory and project allocations
- Credential-based Admin, Coordinator, Faculty, Supervisor and Student workspaces
- Faculty project publishing
- Supervisor-created teams with generated institutional Team IDs
- One active project application per team
- Faculty acceptance/rejection with mandatory rejection remarks
- Public display of accepted allocations
- PostgreSQL relational schema, audit log and notification foundation
- Docker, Render, Vercel and own-server deployment paths
- CSV master templates and extension points for production import validation

## Local setup

1. Install Node.js 22+ and PostgreSQL 16+.
2. Copy `.env.example` to `.env` and update values.
3. Run:

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

Demo users use password `Falcon@123`: `admin`, `faculty`, `supervisor`, `student`.

## Docker setup

```bash
docker compose up -d db
cp .env.example .env
# Set DATABASE_URL to postgresql://postgres:postgres@localhost:5432/falcon_pbl
npm install
npm run db:setup
docker compose up --build web
```

For a fully containerised first boot, run migrations and seed from a temporary Node container or from the host before starting the web service.

## Production deployment

Read:

- `docs/DEPLOYMENT.md`
- `docs/MAINTENANCE.md`
- `docs/ARCHITECTURE.md`
- `docs/DATABASE.md`
- `docs/OPERATIONS.md`
- `docs/TESTING.md`

## Important V1 boundary

The web workflow is functional. Faculty/Student Master CSV templates are included, while the complete browser-based bulk-import validation/preview/rollback module is intentionally documented as the next implementation unit. This prevents an unsafe partial importer from being mistaken for a production-ready master-data loader.
