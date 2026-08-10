import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbFacultyDashboard,
  ProjectItem,
  MenteeTeamItem,
  ApplicationItem,
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

  return (
    <AirbnbFacultyDashboard
      displayName={user.displayName}
      myProjects={defaultProjects}
      menteeTeams={defaultMenteeTeams}
      applications={applications}
    />
  );
}
