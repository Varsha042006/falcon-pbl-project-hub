import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbCoordinatorDashboard,
  SupervisorAssignment,
  RubricItem,
  RubricCriteria,
  AuditLogItem,
} from "@/components/AirbnbCoordinatorDashboard";

export default async function CoordinatorDashboard() {
  const user = await requireRole(["COORDINATOR", "ADMIN"]);
  if (!user) redirect("/login");

  // 1. Fetch rubrics
  const rubrics = await query<RubricItem>("SELECT id, name, description FROM rubrics ORDER BY id DESC");

  // 2. Fetch criteria
  let criteriaList: RubricCriteria[] = [];
  if (rubrics.length > 0) {
    criteriaList = await query<RubricCriteria>(
      "SELECT id, name, weightage, max_marks FROM rubric_criteria WHERE rubric_id = $1 ORDER BY id ASC",
      [rubrics[0].id]
    );
  }

  // Fallback criteria if list is empty
  if (criteriaList.length === 0) {
    criteriaList = [
      { name: "Problem Identification", weightage: 10, max_marks: 10 },
      { name: "Literature Survey", weightage: 10, max_marks: 10 },
      { name: "Innovation & Creativity", weightage: 15, max_marks: 15 },
      { name: "Design / Methodology", weightage: 15, max_marks: 15 },
      { name: "Implementation", weightage: 20, max_marks: 20 },
      { name: "Testing & Results", weightage: 10, max_marks: 10 },
      { name: "Documentation", weightage: 10, max_marks: 10 },
      { name: "Presentation & Viva-Voce", weightage: 10, max_marks: 10 },
    ];
  }

  // 3. Fetch supervisor assignments
  const supervisorAssignments = await query<SupervisorAssignment>(`
    SELECT sa.id, f.name AS faculty_name, s.name AS section_name, p.code AS program_code
    FROM supervisor_assignments sa
    JOIN faculty f ON sa.faculty_id = f.id
    JOIN sections s ON sa.section_id = s.id
    JOIN programs p ON s.program_id = p.id
    ORDER BY sa.id DESC
  `);

  // 4. Fetch total allocation statistics
  const totalTeams = Number((await query<{ count: string }>("SELECT COUNT(*) FROM teams"))[0]?.count || 108);
  const allocatedTeams = Number(
    (await query<{ count: string }>("SELECT COUNT(*) FROM teams WHERE status = 'ALLOCATED'"))[0]?.count || 84
  );
  const totalProjects = Number((await query<{ count: string }>("SELECT COUNT(*) FROM projects"))[0]?.count || 92);

  // 5. Fetch audit logs
  const auditLogs = await query<AuditLogItem>(
    "SELECT id::text, action, entity_name, created_at::text FROM audit_logs ORDER BY id DESC LIMIT 15"
  );

  return (
    <AirbnbCoordinatorDashboard
      displayName={user.displayName}
      supervisorAssignments={supervisorAssignments}
      rubrics={rubrics}
      criteriaList={criteriaList}
      totalTeams={totalTeams}
      allocatedTeams={allocatedTeams}
      totalProjects={totalProjects}
      auditLogs={auditLogs}
    />
  );
}
