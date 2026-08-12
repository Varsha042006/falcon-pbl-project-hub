import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireRole(["ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === "ASSIGN_SEMESTER_COORDINATOR") {
      const { semester, coordinator_faculty_id, mentor_faculty_id } = data;

      if (!semester) {
        return NextResponse.json({ error: "Semester is required" }, { status: 400 });
      }

      await query(
        `
        INSERT INTO semester_coordinators (semester, coordinator_faculty_id, mentor_faculty_id, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (semester)
        DO UPDATE SET 
          coordinator_faculty_id = EXCLUDED.coordinator_faculty_id,
          mentor_faculty_id = EXCLUDED.mentor_faculty_id,
          updated_at = NOW();
        `,
        [semester, coordinator_faculty_id, mentor_faculty_id]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, details)
         VALUES ($1, 'ASSIGN_SEMESTER_COORDINATOR', 'semester_coordinators', $2::jsonb)`,
        [user.id, JSON.stringify({ semester, coordinator_faculty_id, mentor_faculty_id, updated_by: user.displayName })]
      );

      return NextResponse.json({
        success: true,
        message: `Successfully assigned Semester Coordinator & Faculty Mentor for Semester ${semester}!`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
