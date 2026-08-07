# Testing Strategy

## Required workflow tests

1. Public visitor can browse projects without login.
2. Protected pages redirect unauthenticated visitors.
3. Supervisor creates a team from eligible students.
4. Generated Team ID is unique.
5. Student without a team cannot apply.
6. Team can submit one active application.
7. A second active application is blocked by the database.
8. Faculty sees only relevant applications.
9. Rejection without remarks fails.
10. Rejected team can apply to another project.
11. Acceptance respects project capacity.
12. Accepted allocation appears on the public page.
13. Public pages do not expose phone/email/password hashes.

## Release smoke test

Run the four seeded demo roles through the complete cycle. Verify desktop and mobile layouts, HTTPS, database connectivity and audit-log creation.
