import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listProjects } from "@/lib/data";

export default async function Home() {
  const session = await getSession();

  // If user is not logged in, immediately redirect to login page
  if (!session) {
    redirect("/login");
  }

  let projects = [] as Awaited<ReturnType<typeof listProjects>>;
  try {
    projects = await listProjects();
  } catch {}

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Discover, form teams and build meaningful PBL projects.</h1>
          <p className="lead">
            A transparent platform where faculty publish project ideas, supervisors create student teams, teams apply using institutional Team IDs, and allocations remain publicly visible.
          </p>
          <p>
            <Link className="btn" href="/projects">
              Explore Project Ideas
            </Link>{" "}
            &nbsp;{" "}
            <Link className="btn secondary" href="/allocations">
              View Allocations
            </Link>
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="card">
              <div className="metric">{projects.length}</div>
              Published projects
            </div>
            <div className="card">
              <div className="metric">Public</div>
              Allocation transparency
            </div>
            <div className="card">
              <div className="metric">RBAC</div>
              Protected operational actions
            </div>
          </div>
          <h2>Recently published projects</h2>
          <div className="grid">
            {projects.slice(0, 6).map((p) => (
              <div className="card" key={p.id}>
                <span className="status">{p.status}</span>
                <h3>{p.title}</h3>
                <p>{p.short_description}</p>
                <div>
                  {p.technology_stack.split(",").map((t) => (
                    <span className="tag" key={t}>
                      {t.trim()}
                    </span>
                  ))}
                </div>
                <p>
                  <small>
                    Published by {p.publisher_name} · {p.allocated_count}/{p.max_teams} allocated
                  </small>
                </p>
                <Link className="btn secondary" href={`/projects/${p.id}`}>
                  View details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
