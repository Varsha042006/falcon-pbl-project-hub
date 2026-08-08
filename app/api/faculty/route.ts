import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireRole(["FACULTY", "SUPERVISOR", "COORDINATOR", "ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    // Get Faculty ID for the logged in user
    let facultyId = user.facultyId;
    if (!facultyId) {
      const facRows = await query<{ id: number }>("SELECT id FROM faculty ORDER BY id ASC LIMIT 1");
      facultyId = facRows[0]?.id || 1;
    }

    if (action === "CREATE_PROJECT") {
      const { title, short_description, description, domain, technology_stack, suitable_semester, max_teams } = data;

      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      const res = await query<{ id: number }>(
        `INSERT INTO projects (title, short_description, description, domain, technology_stack, suitable_semester, max_teams, published_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          title,
          short_description || title,
          description || short_description || title,
          domain || "Web Engineering",
          technology_stack || "Next.js, PostgreSQL",
          suitable_semester || "Semester V",
          Number(max_teams || 2),
          facultyId,
        ]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details)
         VALUES ($1, 'CREATE_PROJECT', 'projects', $2, $3::jsonb)`,
        [user.id, res[0]?.id, JSON.stringify({ title, domain, published_by: user.displayName })]
      );

      return NextResponse.json({ success: true, id: res[0]?.id, message: "Project published successfully!" });
    }

    if (action === "UPDATE_PROJECT") {
      const { id, title, domain, technology_stack, max_teams, description } = data;

      if (id) {
        await query(
          `UPDATE projects 
           SET title = $1, domain = $2, technology_stack = $3, max_teams = $4, description = COALESCE($5, description)
           WHERE id = $6`,
          [title, domain, technology_stack, max_teams, description, id]
        );
      }

      return NextResponse.json({ success: true, message: "Project updated successfully!" });
    }

    if (action === "DELETE_PROJECT") {
      const { id } = data;

      if (id) {
        await query("DELETE FROM projects WHERE id = $1", [id]);
      }

      return NextResponse.json({ success: true, message: "Project deleted successfully!" });
    }

    if (action === "SUBMIT_EVALUATION") {
      const { team_id, student_id, co5_marks, co6_marks, remarks } = data;

      // Insert or update team_evaluations
      const evalRes = await query<{ id: number }>(
        `INSERT INTO team_evaluations (team_id, evaluated_by, status)
         VALUES ($1, $2, 'SUBMITTED') RETURNING id`,
        [team_id || 1, facultyId]
      );
      const evalId = evalRes[0]?.id || 1;

      // Insert evaluation marks
      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, details)
         VALUES ($1, 'SUBMIT_EVALUATION', 'team_evaluations', $2::jsonb)`,
        [user.id, JSON.stringify({ team_id, student_id, co5_marks, co6_marks, remarks, evaluator: user.displayName })]
      );

      return NextResponse.json({ success: true, message: "Evaluation marks submitted successfully!" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
