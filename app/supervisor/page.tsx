import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function SupervisorDashboard() {
  const user = await requireRole(["SUPERVISOR", "ADMIN", "COORDINATOR"]);
  if (!user) redirect("/login");

  const teams = await query<{
    id: number;
    team_code: string;
    team_name: string;
    leader_name: string;
    status: string;
  }>(`
    SELECT t.id, t.team_code, t.team_name, t.status, s.name as leader_name 
    FROM teams t
    LEFT JOIN students s ON t.leader_student_id = s.id
    ORDER BY t.id DESC
  `);

  return (
    <section className="section">
      <div className="container">
        <h1>📋 PBL Supervisor Portal</h1>
        <p className="lead">
          Section Supervision & Team Allocation • Welcome, <strong>{user.displayName}</strong>
        </p>

        <div style={{ marginBottom: "20px" }}>
          <Link className="btn" href="/supervisor/teams/new">
            + Form New Student Team
          </Link>
        </div>

        <h2>Supervised Student Teams</h2>
        <div className="grid">
          {teams.map((t) => (
            <div className="card" key={t.id}>
              <span className="status">{t.status}</span>
              <h3>{t.team_name}</h3>
              <p>Team ID: <strong>{t.team_code}</strong></p>
              <p>Team Lead: {t.leader_name}</p>
              <Link className="btn secondary" href={`/teams`}>
                Manage Team
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
