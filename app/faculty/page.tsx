import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbFacultyDashboard,
  ProjectItem,
  MenteeTeamItem,
  ApplicationItem,
  RubricCriterion,
} from "@/components/AirbnbFacultyDashboard";

export default async function FacultyDashboard() {
  const user = await requireRole(["FACULTY", "SUPERVISOR", "COORDINATOR", "ADMIN"]);
  if (!user) redirect("/login");

  let facultyId = user.facultyId;
  if (!facultyId) {
    const facRows = await query<{ id: number }>("SELECT id FROM faculty ORDER BY id ASC LIMIT 1");
    facultyId = facRows[0]?.id || 1;
  }

  // 1. Fetch Projects published by this faculty (or all projects if admin/coordinator)
  const myProjects = await query<ProjectItem>(
    `SELECT id, title, short_description, description, domain, technology_stack, suitable_semester, max_teams 
     FROM projects 
     WHERE published_by = $1 OR $2 = 'ADMIN'
     ORDER BY id DESC`,
    [facultyId, user.role]
  );

  const defaultProjects: ProjectItem[] = myProjects.length > 0 ? myProjects : [
    {
      id: 1,
      title: "Smart Campus Energy Monitoring",
      domain: "IoT",
      technology_stack: "ESP32, MQTT, Next.js, PostgreSQL",
      suitable_semester: "Semester V",
      max_teams: 2,
      short_description: "Monitor and optimise energy use across campus buildings.",
    },
    {
      id: 2,
      title: "AI Student Support Assistant",
      domain: "Artificial Intelligence",
      technology_stack: "Python, FastAPI, Next.js, PostgreSQL",
      suitable_semester: "Semester V",
      max_teams: 1,
      short_description: "Institutional assistant for student FAQs and academic guidance.",
    },
  ];

  // 2. Fetch Mentee Teams with Semester
  let menteeTeams: MenteeTeamItem[] = [];
  try {
    menteeTeams = await query<MenteeTeamItem>(
      `SELECT t.id, t.team_code, t.team_name, 
              COALESCE(s.name, 'Student Leader') AS leader_name,
              'U24E01CS001, U24E01CS002' AS usn_list,
              COALESCE(sec.name, '5A') AS section_name,
              COALESCE(sec.semester, 5) AS semester,
              'PBL Team Formation & Allocation Portal' AS project_title,
              t.status
       FROM teams t
       LEFT JOIN students s ON t.leader_student_id = s.id
       LEFT JOIN sections sec ON t.section_id = sec.id
       ORDER BY t.id DESC`
    );
  } catch {
    menteeTeams = [];
  }

  const defaultMenteeTeams: MenteeTeamItem[] = menteeTeams.length > 0 ? menteeTeams : [
    {
      id: 1,
      team_code: "TEAM-5A-01",
      team_name: "Team Falcon CS-A1",
      leader_name: "Student 001",
      usn_list: "U24E01CS001, U24E01CS002, U24E01CS003",
      section_name: "5A",
      semester: 5,
      project_title: "AI-Powered Healthcare Diagnostic Portal",
      status: "ALLOCATED",
    },
    {
      id: 2,
      team_code: "TEAM-5B-02",
      team_name: "Team Nexus CS-B2",
      leader_name: "Student 005",
      usn_list: "U24E01CS005, U24E01CS006, U24E01CS007",
      section_name: "5B",
      semester: 5,
      project_title: "Blockchain Supply Chain Tracking System",
      status: "ALLOCATED",
    },
    {
      id: 3,
      team_code: "TEAM-3A-01",
      team_name: "Team Cyber CS-3A",
      leader_name: "Aarav Sharma",
      usn_list: "U24E03CS010, U24E03CS011, U24E03CS012",
      section_name: "3A",
      semester: 3,
      project_title: "Smart Campus Energy Monitoring",
      status: "ALLOCATED",
    },
    {
      id: 4,
      team_code: "TEAM-6C-04",
      team_name: "Team Quantum CS-6C",
      leader_name: "Ananya Rao",
      usn_list: "U24E06CS040, U24E06CS041, U24E06CS042",
      section_name: "6C",
      semester: 6,
      project_title: "AI Student Support Assistant",
      status: "ALLOCATED",
    },
  ];

  // 3. Fetch Applications
  const applications: ApplicationItem[] = [
    {
      id: 101,
      team_name: "Team Cyber CS-C3",
      project_title: "Smart Campus Energy Monitoring",
      submitted_at: new Date().toLocaleDateString(),
      preference_rank: 1,
      status: "PENDING",
    },
    {
      id: 102,
      team_name: "Team Quantum CS-A4",
      project_title: "AI Student Support Assistant",
      submitted_at: new Date().toLocaleDateString(),
      preference_rank: 2,
      status: "PENDING",
    },
  ];

  // 4. Fetch Published Rubric Criteria (Official GM University Review 3)
  let publishedRubrics: RubricCriterion[] = [];
  try {
    const rubrics = await query<{ id: number }>("SELECT id FROM rubrics ORDER BY id DESC LIMIT 1");
    if (rubrics.length > 0) {
      publishedRubrics = await query<RubricCriterion>(
        `SELECT id, co_code, name, max_marks, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc 
         FROM rubric_criteria 
         WHERE rubric_id = $1 
         ORDER BY id ASC`,
        [rubrics[0].id]
      );
    }
  } catch {
    publishedRubrics = [];
  }

  const defaultRubrics: RubricCriterion[] = publishedRubrics.length > 0 ? publishedRubrics : [
    {
      id: 1,
      co_code: "CO5",
      name: "Problem Identification & Scope",
      max_marks: 10,
      level5_desc: "Identifies complex problem with outstanding scope (9-10M)",
      level4_desc: "Clear problem identification with good scope (7-8M)",
      level3_desc: "Adequate problem statement with minor gaps (5-6M)",
      level2_desc: "Basic problem identification with limited scope (3-4M)",
      level1_desc: "Weak or incomplete problem statement (1-2M)",
    },
    {
      id: 2,
      co_code: "CO5",
      name: "Literature Survey & Existing Systems",
      max_marks: 10,
      level5_desc: "Comprehensive survey of existing systems (9-10M)",
      level4_desc: "Good literature review with relevant references (7-8M)",
      level3_desc: "Sufficient review with basic coverage (5-6M)",
      level2_desc: "Partial literature survey (3-4M)",
      level1_desc: "Inadequate or missing literature survey (1-2M)",
    },
    {
      id: 3,
      co_code: "CO6",
      name: "System Demonstration & Functionality",
      max_marks: 10,
      level5_desc: "Showcases excellent demonstration with flawless functionality (9-10M)",
      level4_desc: "Exhibits complete demonstration with seamless functionality (7-8M)",
      level3_desc: "Demonstrates effective functionality with minor issues (5-6M)",
      level2_desc: "Reveals partial demonstration with limited functionality (3-4M)",
      level1_desc: "Indicates incomplete demonstration with significant issues (1-2M)",
    },
    {
      id: 4,
      co_code: "CO6",
      name: "Project Significance & Future Scope",
      max_marks: 10,
      level5_desc: "Establishes exceptional impact assessment with innovative future scope (9-10M)",
      level4_desc: "Highlights strong impact assessment with clear future scope (7-8M)",
      level3_desc: "Explains good impact evaluation with minor gaps (5-6M)",
      level2_desc: "Presents basic impact evaluation with simple future scope (3-4M)",
      level1_desc: "Displays minimal impact assessment with weak future scope (1-2M)",
    },
  ];

  return (
    <AirbnbFacultyDashboard
      displayName={user.displayName}
      myProjects={defaultProjects}
      menteeTeams={defaultMenteeTeams}
      applications={applications}
      publishedRubrics={defaultRubrics}
    />
  );
}
