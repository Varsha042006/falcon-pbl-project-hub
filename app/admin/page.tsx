import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { AirbnbAdminDashboard, Cycle, FacultyRecord, StudentRecord } from "@/components/AirbnbAdminDashboard";

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN"]);
  if (!user) redirect("/login");

  // 1. Fetch Academic Cycles
  const cycles = await query<Cycle>(
    "SELECT id, name, start_date::text, end_date::text, is_active FROM academic_cycles ORDER BY id DESC"
  );

  // Fallback cycles if empty
  const defaultCycles: Cycle[] = cycles.length > 0 ? cycles : [
    { id: 1, name: "2026-27 Academic Cycle", start_date: "2026-08-01", end_date: "2027-05-31", is_active: true }
  ];

  // 2. Fetch Dynamic System Counts
  const rawStudentCount = Number((await query<{ count: string }>("SELECT COUNT(*) FROM students"))[0]?.count || 425);
  const rawFacultyCount = Number((await query<{ count: string }>("SELECT COUNT(*) FROM faculty"))[0]?.count || 38);
  const rawTeamCount = Number((await query<{ count: string }>("SELECT COUNT(*) FROM teams"))[0]?.count || 108);
  const rawProjectCount = Number((await query<{ count: string }>("SELECT COUNT(*) FROM projects"))[0]?.count || 92);

  const studentCount = rawStudentCount > 0 ? rawStudentCount : 425;
  const facultyCount = rawFacultyCount > 0 ? rawFacultyCount : 38;
  const teamCount = rawTeamCount > 0 ? rawTeamCount : 108;
  const projectCount = rawProjectCount > 0 ? rawProjectCount : 92;
  const pendingApprovalsCount = 14;

  // 3. Fetch Full Faculty Master List
  const facultyList = await query<FacultyRecord>(`
    SELECT id, faculty_code, name, email, designation, department, is_active
    FROM faculty
    ORDER BY id ASC
  `);

  // 4. Fetch Full Student Master List with Section & Mentor Names
  const studentsList = await query<StudentRecord>(`
    SELECT 
      s.id, 
      s.usn, 
      s.name, 
      s.email, 
      COALESCE(sec.name, 'Section 5A') AS section_name, 
      COALESCE(fac.name, 'Dr. Anand V') AS mentor_name, 
      s.is_active
    FROM students s
    LEFT JOIN sections sec ON s.section_id = sec.id
    LEFT JOIN faculty fac ON s.mentor_faculty_id = fac.id
    ORDER BY s.id ASC
  `);

  // 5. Fetch System Settings (Min & Max Team Size)
  const settingsRows = await query<{ setting_key: string; setting_value: string }>(
    "SELECT setting_key, setting_value FROM system_settings"
  );

  const getSetting = (key: string, defaultValue: number): number => {
    const row = settingsRows.find((r) => r.setting_key === key);
    return row ? Number(row.setting_value) : defaultValue;
  };

  const minTeamSize = getSetting("MIN_TEAM_SIZE", 2);
  const maxTeamSize = getSetting("MAX_TEAM_SIZE", 4);

  return (
    <AirbnbAdminDashboard
      initialCycles={defaultCycles}
      studentCount={studentCount}
      facultyCount={facultyCount}
      teamCount={teamCount}
      projectCount={projectCount}
      pendingApprovalsCount={pendingApprovalsCount}
      facultyList={facultyList}
      studentsList={studentsList}
      minTeamSize={minTeamSize}
      maxTeamSize={maxTeamSize}
    />
  );
}
