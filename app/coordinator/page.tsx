import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function CoordinatorDashboard() {
  const user = await requireRole(["COORDINATOR", "ADMIN"]);
  if (!user) redirect("/login");

  // Fetch rubrics
  const rubrics = await query<{
    id: number;
    name: string;
    description: string;
  }>("SELECT id, name, description FROM rubrics ORDER BY id DESC");

  // Fetch criteria for the standard rubric
  let criteria: { name: string; weightage: number; max_marks: number }[] = [];
  if (rubrics.length > 0) {
    criteria = await query<{ name: string; weightage: number; max_marks: number }>(
      "SELECT name, weightage, max_marks FROM rubric_criteria WHERE rubric_id = $1 ORDER BY id ASC",
      [rubrics[0].id]
    );
  }

  // Fetch supervisor assignments
  const supervisorAssignments = await query<{
    id: number;
    faculty_name: string;
    section_name: string;
    program_code: string;
  }>(`
    SELECT sa.id, f.name AS faculty_name, s.name AS section_name, p.code AS program_code
    FROM supervisor_assignments sa
    JOIN faculty f ON sa.faculty_id = f.id
    JOIN sections s ON sa.section_id = s.id
    JOIN programs p ON s.program_id = p.id
    ORDER BY sa.id DESC
  `);

  // Fetch total allocation statistics
  const totalTeams = (await query<{ count: string }>("SELECT COUNT(*) FROM teams"))[0].count;
  const allocatedTeams = (
    await query<{ count: string }>("SELECT COUNT(*) FROM teams WHERE status = 'ALLOCATED'")
  )[0].count;
  const totalProjects = (await query<{ count: string }>("SELECT COUNT(*) FROM projects"))[0].count;

  // Fetch audits logs
  const auditLogs = await query<{
    id: string;
    action: string;
    entity_name: string;
    created_at: string;
  }>("SELECT id, action, entity_name, created_at FROM audit_logs ORDER BY id DESC LIMIT 5");

  return (
    <section className="section">
      <div className="container">
        {/* Welcome Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1>📋 PBL Coordinator Dashboard</h1>
            <p className="lead">
              Rubrics Creator, Supervisor Mapping & Reports Workspace • Welcome, <strong>{user.displayName}</strong>
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="btn secondary">Logout</button>
          </form>
        </div>

        {/* Top KPI Metrics Block */}
        <div className="grid" style={{ marginBottom: "32px" }}>
          <div className="card">
            <div className="metric">{supervisorAssignments.length}</div>
            Active Supervisors
          </div>
          <div className="card">
            <div className="metric">
              {allocatedTeams} / {totalTeams}
            </div>
            Teams Allocated
          </div>
          <div className="card">
            <div className="metric">{rubrics.length}</div>
            Evaluation Rubrics
          </div>
          <div className="card">
            <div className="metric">{totalProjects}</div>
            Total PBL Projects
          </div>
        </div>

        {/* Role Wise Dashboard Modules */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          {/* Module 1: Supervisor Mapping */}
          <div className="card">
            <h2>👥 Supervisor Mapping & Allocation</h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
              Assign supervisors to specific academic cycles and class sections.
            </p>
            <div className="tablewrap" style={{ maxHeight: "200px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Supervisor</th>
                    <th>Section</th>
                    <th>Program</th>
                  </tr>
                </thead>
                <tbody>
                  {supervisorAssignments.map((sa) => (
                    <tr key={sa.id}>
                      <td>{sa.faculty_name}</td>
                      <td>{sa.section_name}</td>
                      <td>{sa.program_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "16px" }}>
              <Link href="/supervisor/teams/new" className="btn secondary">
                Manage Supervisors
              </Link>
            </div>
          </div>

          {/* Module 2: Rubrics & Criteria Management */}
          <div className="card">
            <h2>📊 Rubrics & Criteria Creator</h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
              Predefined weights & evaluation criteria (visible to all students & guides).
            </p>

            {rubrics.length > 0 ? (
              <div>
                <strong style={{ display: "block", marginBottom: "10px", color: "var(--navy)" }}>
                  {rubrics[0].name}
                </strong>
                <div className="tablewrap" style={{ maxHeight: "150px" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Criteria</th>
                        <th>Weightage</th>
                        <th>Max Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, i) => (
                        <tr key={i}>
                          <td>{c.name}</td>
                          <td>{c.weightage}%</td>
                          <td>{c.max_marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p>No rubrics templates created yet.</p>
            )}
            <div style={{ marginTop: "16px" }}>
              <button className="btn secondary" onClick={() => alert("Creating rubric template...")}>
                + Add Criteria Template
              </button>
            </div>
          </div>
        </div>

        {/* Audit Log / History View */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <h2>🛡️ Process Audit Logs & Timelines</h2>
          {auditLogs.length > 0 ? (
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Action</th>
                    <th>Target Entity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>
                      <td>{log.action}</td>
                      <td>{log.entity_name}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              No audit logs captured. Everything is verified and running!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
