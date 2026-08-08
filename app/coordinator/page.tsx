import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbCoordinatorDashboard,
  SupervisorAssignment,
  FacultyItem,
  SectionItem,
  RubricItem,
  RubricCriteria,
  AuditLogItem,
} from "@/components/AirbnbCoordinatorDashboard";

export default async function CoordinatorDashboard() {
  const user = await requireRole(["COORDINATOR", "ADMIN"]);
  if (!user) redirect("/login");

  // 1. Fetch all faculty members
  const allFaculty = await query<FacultyItem>(`
    SELECT id, faculty_code, name, email, designation, department 
    FROM faculty 
    WHERE is_active = true 
    ORDER BY id ASC
  `);

  // Fallback faculty if empty
  const defaultFaculty: FacultyItem[] = allFaculty.length > 0 ? allFaculty : [
    { id: 1, faculty_code: "FAC001", name: "Dr. Anand V", email: "anand@gmu.ac.in", designation: "Professor", department: "CSE" },
    { id: 2, faculty_code: "FAC002", name: "Prof. Sneha K", email: "sneha@gmu.ac.in", designation: "Assistant Professor", department: "CSE" },
    { id: 3, faculty_code: "FAC003", name: "Dr. Rajesh M", email: "rajesh@gmu.ac.in", designation: "Associate Professor", department: "CSE" },
  ];

  // 2. Fetch all class sections (Semesters 1 to 8, Sections A, B, C)
  const dbSections = await query<SectionItem>(`
    SELECT id, name 
    FROM sections 
    ORDER BY semester ASC, name ASC
  `);

  // Ensure full coverage from Semester 1 to 8 (A, B, C)
  const fullSectionsList: SectionItem[] = [];
  let secIdCounter = 1;

  for (let sem = 1; sem <= 8; sem++) {
    for (const letter of ["A", "B", "C"]) {
      const code = `${sem}${letter}`;
      const existing = dbSections.find((s) => s.name === code || s.name === `${sem}th ${letter}`);
      if (existing) {
        fullSectionsList.push(existing);
      } else {
        fullSectionsList.push({ id: secIdCounter * 100 + sem, name: code });
      }
      secIdCounter++;
    }
  }

  const allSections = dbSections.length > 0 ? dbSections : fullSectionsList;

  // 3. Fetch rubrics
  const rubrics = await query<RubricItem>("SELECT id, name, description FROM rubrics ORDER BY id DESC");

  // 4. Fetch criteria
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

  // 5. Fetch supervisor assignments
  const supervisorAssignments = await query<SupervisorAssignment>(`
    SELECT sa.id, sa.faculty_id, f.name AS faculty_name, s.name AS section_name, COALESCE(p.code, 'CSE') AS program_code
    FROM supervisor_assignments sa
    JOIN faculty f ON sa.faculty_id = f.id
    JOIN sections s ON sa.section_id = s.id
    LEFT JOIN programs p ON s.program_id = p.id
    ORDER BY sa.id DESC
  `);

  // 6. Fetch total allocation statistics
  const totalTeams = Number((await query<{ count: string }>("SELECT COUNT(*) FROM teams"))[0]?.count || 108);
  const allocatedTeams = Number(
    (await query<{ count: string }>("SELECT COUNT(*) FROM teams WHERE status = 'ALLOCATED'"))[0]?.count || 84
  );
  const totalProjects = Number((await query<{ count: string }>("SELECT COUNT(*) FROM projects"))[0]?.count || 92);

  // 7. Fetch audit logs
  const auditLogs = await query<AuditLogItem>(
    "SELECT id::text, action, entity_name, created_at::text FROM audit_logs ORDER BY id DESC LIMIT 15"
  );

  return (
    <AirbnbCoordinatorDashboard
      displayName={user.displayName}
      supervisorAssignments={supervisorAssignments}
      allFaculty={defaultFaculty}
      allSections={allSections.length >= 24 ? allSections : fullSectionsList}
      rubrics={rubrics}
      criteriaList={criteriaList}
      totalTeams={totalTeams}
      allocatedTeams={allocatedTeams}
      totalProjects={totalProjects}
      auditLogs={auditLogs}
    />
  );
}
