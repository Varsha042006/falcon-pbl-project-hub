import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function FacultyDashboard() {
  const user = await requireRole(["FACULTY", "SUPERVISOR", "ADMIN", "COORDINATOR"]);
  if (!user) redirect("/login");

  const myProjects = await query<{
    id: number;
    title: string;
    domain: string;
    status: string;
    max_teams: number;
  }>("SELECT id, title, domain, status, max_teams FROM projects ORDER BY id DESC");

  return (
    <section className="section">
      <div className="container">
        <h1>👨‍🏫 Faculty Portal</h1>
        <p className="lead">
          Project Proposal Management & Guidance • Welcome, <strong>{user.displayName}</strong>
        </p>

        <div style={{ marginBottom: "20px" }}>
          <Link className="btn" href="/faculty/projects/new">
            + Publish New Project Idea
          </Link>{" "}
          &nbsp;
          <Link className="btn secondary" href="/faculty/applications">
            View Applications
          </Link>
        </div>

        <h2>Published Project Ideas</h2>
        <div className="grid">
          {myProjects.map((p) => (
            <div className="card" key={p.id}>
              <span className="status">{p.status}</span>
              <h3>{p.title}</h3>
              <p>Domain: {p.domain}</p>
              <p>Max Teams: {p.max_teams}</p>
              <Link className="btn secondary" href={`/projects/${p.id}`}>
                View Details
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
