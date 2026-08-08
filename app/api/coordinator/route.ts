import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const user = await requireRole(["COORDINATOR", "ADMIN"]);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, data } = body;

    if (action === "ASSIGN_SUPERVISOR") {
      const { faculty_id, section_id, is_primary } = data;

      if (!faculty_id || !section_id) {
        return NextResponse.json({ error: "Faculty and Section are required" }, { status: 400 });
      }

      const cycleRows = await query<{ id: number }>(
        "SELECT id FROM academic_cycles WHERE is_active = true ORDER BY id DESC LIMIT 1"
      );
      const cycleId = cycleRows[0]?.id || 1;

      const result = await query<{ id: number }>(
        `
        INSERT INTO supervisor_assignments (cycle_id, section_id, faculty_id, is_primary, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (cycle_id, section_id, faculty_id) 
        DO UPDATE SET is_active = true, is_primary = EXCLUDED.is_primary
        RETURNING id;
        `,
        [cycleId, section_id, faculty_id, is_primary || false]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, details)
         VALUES ($1, 'ASSIGN_SUPERVISOR', 'supervisor_assignments', $2, $3::jsonb)`,
        [
          user.id,
          result[0]?.id || 1,
          JSON.stringify({ faculty_id, section_id, assigned_by: user.displayName }),
        ]
      );

      return NextResponse.json({
        success: true,
        assignmentId: result[0]?.id,
        message: "Faculty successfully assigned as supervisor!",
      });
    }

    if (action === "ADD_CRITERIA") {
      const { name, weightage, max_marks, co_code, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc } = data;

      const rubricRows = await query<{ id: number }>("SELECT id FROM rubrics ORDER BY id ASC LIMIT 1");
      const rubricId = rubricRows[0]?.id || 1;

      const res = await query<{ id: number }>(
        `INSERT INTO rubric_criteria (rubric_id, co_code, name, weightage, max_marks, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [rubricId, co_code || "CO5", name, weightage, max_marks, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc]
      );

      return NextResponse.json({ success: true, id: res[0]?.id });
    }

    if (action === "UPDATE_CRITERIA") {
      const { id, name, weightage, max_marks, co_code, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc } = data;

      if (id) {
        await query(
          `UPDATE rubric_criteria 
           SET co_code = $1, name = $2, weightage = $3, max_marks = $4, level5_desc = $5, level4_desc = $6, level3_desc = $7, level2_desc = $8, level1_desc = $9 
           WHERE id = $10`,
          [co_code, name, weightage, max_marks, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc, id]
        );
      }

      return NextResponse.json({ success: true });
    }

    if (action === "DELETE_CRITERIA") {
      const { id } = data;

      if (id) {
        await query("DELETE FROM rubric_criteria WHERE id = $1", [id]);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "CREATE_TIMELINE") {
      const { feature_title, description, start_time, end_time, is_enabled } = data;

      if (!feature_title) {
        return NextResponse.json({ error: "Feature title is required" }, { status: 400 });
      }

      const feature_key = feature_title.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now();

      const res = await query<{ id: number }>(
        `INSERT INTO pbl_timelines (feature_key, feature_title, description, start_time, end_time, is_enabled)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [feature_key, feature_title, description || "", start_time, end_time, is_enabled ?? true]
      );

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, details)
         VALUES ($1, 'CREATE_TIMELINE', 'pbl_timelines', $2::jsonb)`,
        [user.id, JSON.stringify({ feature_title, start_time, end_time, created_by: user.displayName })]
      );

      return NextResponse.json({ success: true, id: res[0]?.id, feature_key, message: "Timeline published successfully!" });
    }

    if (action === "UPDATE_TIMELINE") {
      const { id, feature_key, feature_title, description, start_time, end_time, is_enabled } = data;

      if (id) {
        await query(
          `UPDATE pbl_timelines 
           SET feature_title = COALESCE($1, feature_title), description = COALESCE($2, description), start_time = $3, end_time = $4, is_enabled = $5, updated_at = NOW() 
           WHERE id = $6`,
          [feature_title, description, start_time, end_time, is_enabled, id]
        );
      } else if (feature_key) {
        await query(
          `UPDATE pbl_timelines 
           SET feature_title = COALESCE($1, feature_title), description = COALESCE($2, description), start_time = $3, end_time = $4, is_enabled = $5, updated_at = NOW() 
           WHERE feature_key = $6`,
          [feature_title, description, start_time, end_time, is_enabled, feature_key]
        );
      }

      await query(
        `INSERT INTO audit_logs (user_id, action, entity_name, details)
         VALUES ($1, 'UPDATE_TIMELINE', 'pbl_timelines', $2::jsonb)`,
        [user.id, JSON.stringify({ feature_title, start_time, end_time, is_enabled, updated_by: user.displayName })]
      );

      return NextResponse.json({ success: true, message: "Timeline updated successfully!" });
    }

    if (action === "DELETE_TIMELINE") {
      const { id } = data;

      if (id) {
        await query("DELETE FROM pbl_timelines WHERE id = $1", [id]);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
