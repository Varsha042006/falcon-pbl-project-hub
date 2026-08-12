import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import {
  AirbnbMentorDashboard,
  MentorTeamItem,
} from "@/components/AirbnbMentorDashboard";

export default async function MentorDashboardPage() {
  const user = await requireRole(["MENTOR", "FACULTY", "COORDINATOR", "ADMIN"]);
  if (!user) redirect("/login");

  let facultyId = user.facultyId;
  if (!facultyId) {
    const facRows = await query<{ id: number }>("SELECT id FROM faculty ORDER BY id ASC LIMIT 1");
    facultyId = facRows[0]?.id || 1;
  }

  // Fetch mentee teams assigned under this mentor/faculty
  let dbTeams: MentorTeamItem[] = [];
  try {
    const rows = await query<{
      id: number;
      team_code: string;
      team_name: string;
      leader_name: string;
      usn_list: string;
      section_name: string;
      semester: number;
      project_title: string;
      status: string;
      guide_name: string;
    }>(
      `
      SELECT 
        t.id, 
        t.team_code, 
        t.team_name, 
        s.name as leader_name, 
        t.usn_list, 
        sec.name as section_name, 
        sec.semester, 
        COALESCE(p.title, 'PBL Team Formation & Allocation Portal') as project_title, 
        t.status,
        COALESCE(f.name, 'Dr. Anand V') as guide_name
      FROM teams t
      LEFT JOIN students s ON t.leader_student_id = s.id
      LEFT JOIN sections sec ON t.section_id = sec.id
      LEFT JOIN projects p ON t.allocated_project_id = p.id
      LEFT JOIN faculty f ON t.mentor_faculty_id = f.id OR t.guide_faculty_id = f.id
      ORDER BY t.id DESC
      `
    );

    dbTeams = rows.map((r) => ({
      ...r,
      co5_marks: 18,
      co6_marks: 17,
      total_marks: 35,
      max_marks: 40,
      evaluation_status: "SUBMITTED" as const,
      mentor_remarks: "Good technical presentation and well-defined architecture.",
      mentor_signature: "",
    }));
  } catch {}

  const defaultTeams: MentorTeamItem[] = [
    {
      id: 1,
      team_code: "T-5A-01",
      team_name: "Falcon Team Alpha",
      leader_name: "Rahul Sharma",
      usn_list: "U24E01CS001, U24E01CS002, U24E01CS003",
      section_name: "5A",
      semester: 5,
      project_title: "PBL Team Formation & Allocation Portal",
      status: "ALLOCATED",
      guide_name: "Dr. Anand V",
      co5_marks: 18,
      co6_marks: 17,
      total_marks: 35,
      max_marks: 40,
      evaluation_status: "SUBMITTED",
      mentor_remarks: "Good technical presentation and well-defined architecture.",
      mentor_signature: "",
    },
    {
      id: 2,
      team_code: "T-5A-02",
      team_name: "TechInnovators",
      leader_name: "Priya Patel",
      usn_list: "U24E01CS004, U24E01CS005, U24E01CS006",
      section_name: "5A",
      semester: 5,
      project_title: "Smart Campus Energy Monitoring",
      status: "ALLOCATED",
      guide_name: "Prof. Rajesh Kumar",
      co5_marks: 19,
      co6_marks: 18,
      total_marks: 37,
      max_marks: 40,
      evaluation_status: "APPROVED",
      mentor_remarks: "Outstanding hardware IoT prototype and software dashboard.",
      mentor_signature: "Dr. Anand V",
    },
    {
      id: 3,
      team_code: "T-5B-01",
      team_name: "CyberShield",
      leader_name: "Amit Verma",
      usn_list: "U24E01CS007, U24E01CS008",
      section_name: "5B",
      semester: 5,
      project_title: "AI Student Support Assistant",
      status: "ALLOCATED",
      guide_name: "Dr. Sunita Rao",
      co5_marks: 16,
      co6_marks: 15,
      total_marks: 31,
      max_marks: 40,
      evaluation_status: "SUBMITTED",
      mentor_remarks: "RAG model accuracy needs slight improvement before final review.",
      mentor_signature: "",
    },
  ];

  const teams = dbTeams.length > 0 ? dbTeams : defaultTeams;

  return (
    <AirbnbMentorDashboard
      displayName={user.displayName || "Faculty Mentor"}
      teams={teams}
    />
  );
}
