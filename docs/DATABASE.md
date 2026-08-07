# Database Design

The authoritative schema is `db/migrations/001_initial.sql`.

## Core groups

### Academic and people
- `academic_cycles`
- `programs`
- `sections`
- `faculty`
- `students`
- `users`

### Supervision and teams
- `supervisor_assignments`: permits multiple supervisors for one semester-section.
- `student_supervisor_mappings`: assigns each student to one supervisor for an academic cycle.
- `teams`
- `team_members`

### Projects and allocation
- `projects`
- `project_applications`
- `application_discussions`
- `student_project_proposals`

### Operations
- `notifications`
- `import_history`
- `audit_logs`

## Critical integrity rules

- USN, faculty code, username and Team ID are unique.
- A student can belong to only one current team in V1.
- A team may have only one active application (`SUBMITTED`, `DISCUSSION` or `ACCEPTED`).
- Project acceptance checks the configured `max_teams` capacity inside a transaction.
- Rejection remarks are mandatory at application-service level.

## ER diagram

See `ER_Diagram.png`. The SQL migration is the final technical authority if the diagram and schema differ.

## Schema change procedure

1. Add a new numbered SQL migration; never edit a migration already used in production.
2. Test against a copy of production structure.
3. Take a backup.
4. Apply during a maintenance window.
5. Verify row counts and key workflows.
6. Record the deployment in the change log.
