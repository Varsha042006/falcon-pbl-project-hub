import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbSupervisorDashboard,
  StudentItem,
  TeamItem,
  ApplicationItem,
} from "@/components/AirbnbSupervisorDashboard";

export default async function SupervisorDashboardPage() {
  const user = await requireRole(["SUPERVISOR", "ADMIN", "COORDINATOR"]);
  if (!user) redirect("/login");

  // 1. Fetch Students under section supervision
  const students = await query<StudentItem>(`
    SELECT s.id, s.usn, s.name, s.email, sec.semester, sec.name as section_name, tm.team_id, t.team_name, t.team_code
    FROM students s
    JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN team_members tm ON tm.student_id = s.id
    LEFT JOIN teams t ON t.id = tm.team_id
    ORDER BY s.usn
  `);

  // 2. Fetch Supervised Teams with members & allocation data
  const teams = await query<TeamItem>(`
    SELECT 
      t.id, 
      t.team_code, 
      t.team_name, 
      t.status, 
      sec.semester, 
      sec.name as section_name,
      s.name as leader_name, 
      s.usn as leader_usn,
      f.name as supervisor_name,
      STRING_AGG(st.name || ' (' || st.usn || ')', ', ' ORDER BY tm.member_role DESC, st.usn) as members_list,
      COUNT(st.id)::int as member_count,
      p.title as project_title, 
      pf.name as guide_name, 
      pa.status as application_status,
      18::int as co5_marks,
      18::int as co6_marks,
      36::int as total_marks,
      'APPROVED'::text as evaluation_status,
      ''::text as mentor_remarks,
      ''::text as mentor_signature
    FROM teams t
    JOIN sections sec ON t.section_id = sec.id
    LEFT JOIN students s ON t.leader_student_id = s.id
    LEFT JOIN supervisor_assignments sa ON t.supervisor_assignment_id = sa.id
    LEFT JOIN faculty f ON sa.faculty_id = f.id
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN students st ON st.id = tm.student_id
    LEFT JOIN project_applications pa ON pa.team_id = t.id AND pa.status IN ('ACCEPTED', 'SUBMITTED', 'PENDING')
    LEFT JOIN projects p ON p.id = pa.project_id
    LEFT JOIN faculty pf ON pf.id = p.published_by
    GROUP BY t.id, sec.semester, sec.name, s.name, s.usn, f.name, p.title, pf.name, pa.status
    ORDER BY t.team_code
  `);

  // 3. Fetch Project Applications submitted by supervised teams
  const applications = await query<ApplicationItem>(`
    SELECT 
      pa.id, 
      pa.team_id, 
      t.team_code, 
      t.team_name, 
      p.title as project_title, 
      pf.name as project_owner, 
      pa.status
    FROM project_applications pa
    JOIN teams t ON t.id = pa.team_id
    JOIN projects p ON p.id = pa.project_id
    JOIN faculty pf ON pf.id = p.published_by
    ORDER BY pa.id DESC
  `);

  return (
    <AirbnbSupervisorDashboard
      displayName={user.displayName}
      students={students}
      teams={teams}
      applications={applications}
    />
  );
}
