import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN", "COORDINATOR"]);
  if (!user) redirect("/login");

  const usersCount = (await query<{ count: string }>("SELECT COUNT(*) FROM users"))[0].count;
  const facultyCount = (await query<{ count: string }>("SELECT COUNT(*) FROM faculty"))[0].count;
  const studentCount = (await query<{ count: string }>("SELECT COUNT(*) FROM students"))[0].count;
  const projectCount = (await query<{ count: string }>("SELECT COUNT(*) FROM projects"))[0].count;
  const teamCount = (await query<{ count: string }>("SELECT COUNT(*) FROM teams"))[0].count;

  const usersList = await query<{
    id: number;
    username: string;
    display_name: string;
    role: string;
    created_at: string;
  }>("SELECT id, username, display_name, role, created_at FROM users ORDER BY id ASC LIMIT 10");

  return (
    <section className="section">
      <div className="container">
        <h1>👑 Admin & Coordinator Portal</h1>
        <p className="lead">
          System Administration & Academic Cycle Overview • Welcome, <strong>{user.displayName}</strong> ({user.role})
        </p>

        <div className="grid" style={{ marginBottom: "24px" }}>
          <div className="card">
            <div className="metric">{usersCount}</div> Total System Users
          </div>
          <div className="card">
            <div className="metric">{facultyCount}</div> Faculty Members
          </div>
          <div className="card">
            <div className="metric">{studentCount}</div> Students Enrolled
          </div>
          <div className="card">
            <div className="metric">{projectCount}</div> Published Projects
          </div>
          <div className="card">
            <div className="metric">{teamCount}</div> Formed Teams
          </div>
        </div>

        <h2>Registered System Accounts (ER Blueprint)</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username / Code</th>
                <th>Display Name</th>
                <th>Assigned Role</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <strong>{u.username}</strong>
                  </td>
                  <td>{u.display_name}</td>
                  <td>
                    <span className="status">{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "24px" }}>
          <Link className="btn" href="/admin/imports">
            Batch Import Data (Students / Faculty)
          </Link>
        </div>
      </div>
    </section>
  );
}
