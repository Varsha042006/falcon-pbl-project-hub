# Architecture

## Design goals

1. One codebase for Vercel, Render and university-hosted infrastructure.
2. PostgreSQL as the portable system of record.
3. Public read access separated from credential-protected business actions.
4. Server-side validation for every allocation-changing operation.
5. Minimal vendor lock-in.

## Logical layers

- **Presentation:** Next.js App Router and React server components.
- **Application:** Route handlers for login, teams, projects, applications and decisions.
- **Domain rules:** Role checks, one-active-application constraint, project capacity checks, mandatory rejection remarks.
- **Data access:** `pg` connection pool and parameterised SQL.
- **Persistence:** PostgreSQL migrations in `db/migrations`.
- **Security:** Signed HTTP-only JWT session cookie, bcrypt password hashes, role-based access control.

## Public versus protected areas

Public routes expose projects, teams, faculty and accepted allocations. Phone numbers, email addresses, internal remarks, credentials and audit information are never included in public queries.

Protected actions are validated both in the interface and in server route handlers. The database unique partial index prevents multiple active applications even when two requests arrive concurrently.

## Portability

The application uses standard Node.js, PostgreSQL and Docker. It does not require Supabase-specific APIs or Vercel-only storage. Managed PostgreSQL may still be supplied by Render, Neon, Supabase, AWS, Azure, GCP or a university database server.
