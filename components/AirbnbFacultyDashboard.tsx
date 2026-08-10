"use client";

import { useState } from "react";

export interface ProjectItem {
  id: number;
  title: string;
  short_description?: string;
  description?: string;
  domain: string;
  technology_stack?: string;
  suitable_semester?: string;
  max_teams: number;
  status?: string;
}

export interface MenteeTeamItem {
  id: number;
  team_code: string;
  team_name: string;
  leader_name: string;
  usn_list: string;
  section_name: string;
  semester?: number;
  project_title: string;
  status: string;
}

export interface ApplicationItem {
  id: number;
  team_name: string;
  project_title: string;
  submitted_at: string;
  preference_rank: number;
  status: string;
}

export interface TeamMessage {
  id: number;
  sender_name: string;
  sender_role: "FACULTY" | "STUDENT";
  message: string;
  timestamp: string;
}

export interface RubricCriterion {
  id: number;
  co_code: string;
  name: string;
  max_marks: number;
  level5_desc?: string;
  level4_desc?: string;
  level3_desc?: string;
  level2_desc?: string;
  level1_desc?: string;
}

export interface TeamEvaluationRecord {
  criteriaScores: Record<number, number>; // criterionId -> score (0 to max_marks)
  co5_marks: number;
  co6_marks: number;
  remarks: string;
  submitted: boolean;
  updated_at?: string;
}

interface AirbnbFacultyDashboardProps {
  displayName: string;
  myProjects: ProjectItem[];
  menteeTeams: MenteeTeamItem[];
  applications: ApplicationItem[];
  publishedRubrics: RubricCriterion[];
}

type FacultyPageView =
  | "home"
  | "myProjects"
  | "menteeTeams"
  | "applications"
  | "evaluations"
  | "allottedTeams";

export function AirbnbFacultyDashboard({
  displayName,
  myProjects: initialProjects,
  menteeTeams: initialTeams,
  applications: initialApplications,
  publishedRubrics: initialRubrics = [],
}: AirbnbFacultyDashboardProps) {
  const [currentView, setCurrentView] = useState<FacultyPageView>("home");
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [menteeTeams] = useState<MenteeTeamItem[]>(initialTeams);
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [publishedRubrics] = useState<RubricCriterion[]>(initialRubrics);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Selected Semester for Allotted Teams view
  const [selectedAllottedSem, setSelectedAllottedSem] = useState<number>(5);

  // Active Team Workspace State:
  // selectedTeamWorkspaceId -> ID of team selected by clicking team name / button
  // teamSubView -> "hub" (main workspace page with 2 big cards) | "chat" (dedicated chat page) | "eval" (dedicated evaluation page)
  const [selectedTeamWorkspaceId, setSelectedTeamWorkspaceId] = useState<number | null>(null);
  const [teamSubView, setTeamSubView] = useState<"hub" | "chat" | "eval">("hub");

  // Direct standalone team page state:
  const [activeChatTeamId, setActiveChatTeamId] = useState<number | null>(null);
  const [activeEvalTeamId, setActiveEvalTeamId] = useState<number | null>(null);

  const [newMessageText, setNewMessageText] = useState("");

  // Sample initial team chat conversations indexed by team ID
  const [teamChatMessages, setTeamChatMessages] = useState<Record<number, TeamMessage[]>>({
    1: [
      {
        id: 1,
        sender_name: "Student 001 (Leader)",
        sender_role: "STUDENT",
        message: "Good morning Sir! We completed the database schema and API integration for Review 3. Could you please review our draft?",
        timestamp: "Today, 10:15 AM",
      },
      {
        id: 2,
        sender_name: displayName,
        sender_role: "FACULTY",
        message: "Great progress team! Make sure to include CO5 test cases and system performance benchmarks before Review 3 presentation.",
        timestamp: "Today, 10:45 AM",
      },
      {
        id: 3,
        sender_name: "Student 002",
        sender_role: "STUDENT",
        message: "Yes Sir, we have added test scripts for 100 concurrent requests and generated response time graphs.",
        timestamp: "Today, 11:20 AM",
      },
    ],
    2: [
      {
        id: 1,
        sender_name: displayName,
        sender_role: "FACULTY",
        message: "Team CS-B2, please submit your Review 3 slides by tomorrow 5 PM.",
        timestamp: "Yesterday, 3:30 PM",
      },
      {
        id: 2,
        sender_name: "Student 005 (Leader)",
        sender_role: "STUDENT",
        message: "Noted Sir! We are finalizing the architecture diagrams and will upload the slides shortly.",
        timestamp: "Yesterday, 4:10 PM",
      },
    ],
    3: [
      {
        id: 1,
        sender_name: "Aarav Sharma (Leader)",
        sender_role: "STUDENT",
        message: "Respected Guide, we have set up the ESP32 sensors for our Smart Campus project.",
        timestamp: "2 days ago",
      },
      {
        id: 2,
        sender_name: displayName,
        sender_role: "FACULTY",
        message: "Excellent! Test the real-time MQTT payload transmission to the dashboard.",
        timestamp: "Yesterday",
      },
    ],
  });

  // Per-Team Rubrics Evaluation State indexed by team ID
  const [teamEvaluations, setTeamEvaluations] = useState<Record<number, TeamEvaluationRecord>>({
    1: {
      criteriaScores: { 1: 9, 2: 8, 3: 9, 4: 8 },
      co5_marks: 17,
      co6_marks: 17,
      remarks: "Excellent CO5 testing analysis and CO6 demonstration.",
      submitted: true,
      updated_at: "Today",
    },
    2: {
      criteriaScores: { 1: 8, 2: 8, 3: 8, 4: 7 },
      co5_marks: 16,
      co6_marks: 15,
      remarks: "Good implementation. Minor fixes required in reporting.",
      submitted: false,
      updated_at: "Pending",
    },
    3: {
      criteriaScores: { 1: 10, 2: 9, 3: 9, 4: 9 },
      co5_marks: 19,
      co6_marks: 18,
      remarks: "Flawless hardware prototype and clear future scope.",
      submitted: false,
      updated_at: "Pending",
    },
  });

  // New Project Form State
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("Web Engineering");
  const [techStack, setTechStack] = useState("Next.js, PostgreSQL, TypeScript");
  const [semester, setSemester] = useState("Semester V");
  const [maxTeams, setMaxTeams] = useState(2);
  const [shortDesc, setShortDesc] = useState("");

  // Edit Project State
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editTechStack, setEditTechStack] = useState("");
  const [editMaxTeams, setEditMaxTeams] = useState(2);

  // Global Evaluation Form State
  const [selectedTeamId, setSelectedTeamId] = useState<number>(menteeTeams[0]?.id || 1);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handler: Send Message in Team Conversation Room
  const handleSendChatMessage = (e: React.FormEvent, teamId: number) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: TeamMessage = {
      id: Date.now(),
      sender_name: displayName,
      sender_role: "FACULTY",
      message: newMessageText.trim(),
      timestamp: "Just now",
    };

    setTeamChatMessages((prev) => ({
      ...prev,
      [teamId]: [...(prev[teamId] || []), newMsg],
    }));

    const activeTeam = menteeTeams.find((t) => t.id === teamId);
    showToast(`Sent guidance message to ${activeTeam?.team_name || "Team"}!`);
    setNewMessageText("");
  };

  // Handler: Submit Per-Team Evaluation & Marks Allocation using Published Rubric Criteria
  const handleSaveTeamEvaluation = async (e: React.FormEvent, teamId: number) => {
    e.preventDefault();
    const activeTeam = menteeTeams.find((t) => t.id === teamId);
    const evalData = teamEvaluations[teamId] || {
      criteriaScores: { 1: 8, 2: 8, 3: 8, 4: 8 },
      co5_marks: 16,
      co6_marks: 16,
      remarks: "Good performance.",
      submitted: true,
    };

    // Calculate total CO5 & CO6 from criteriaScores
    let calcCo5 = 0;
    let calcCo6 = 0;
    publishedRubrics.forEach((crit) => {
      const score = evalData.criteriaScores[crit.id] ?? Math.round(crit.max_marks * 0.8);
      if (crit.co_code === "CO5") calcCo5 += score;
      if (crit.co_code === "CO6") calcCo6 += score;
    });

    const totalMarks = calcCo5 + calcCo6;

    setTeamEvaluations((prev) => ({
      ...prev,
      [teamId]: {
        ...evalData,
        co5_marks: calcCo5,
        co6_marks: calcCo6,
        submitted: true,
        updated_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    }));

    showToast(`Submitted & Locked Review 3 Rubric Marks (${totalMarks} Marks) for ${activeTeam?.team_name || "Team"}!`);

    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_EVALUATION",
          data: {
            team_id: teamId,
            co5_marks: calcCo5,
            co6_marks: calcCo6,
            remarks: evalData.remarks,
          },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Publish New Project
  const handlePublishProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newProject: ProjectItem = {
      id: Date.now(),
      title,
      domain,
      technology_stack: techStack,
      suitable_semester: semester,
      max_teams: Number(maxTeams),
      short_description: shortDesc || title,
      status: "PUBLISHED",
    };

    setProjects([newProject, ...projects]);
    setTitle("");
    setShortDesc("");
    showToast(`Published new project proposal "${title}"!`);

    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PROJECT",
          data: newProject,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setProjects((prev) =>
            prev.map((p) => (p.id === newProject.id ? { ...p, id: data.id } : p))
          );
        }
      }
    } catch {
      // Toast already shown
    }
  };

  // Save Project Edit
  const handleSaveProjectEdit = async (p: ProjectItem) => {
    const updated: ProjectItem = {
      ...p,
      title: editTitle,
      domain: editDomain,
      technology_stack: editTechStack,
      max_teams: editMaxTeams,
    };

    setProjects((prev) => prev.map((item) => (item.id === p.id ? updated : item)));
    setEditingProjectId(null);
    showToast(`Updated project "${editTitle}"!`);

    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PROJECT",
          data: updated,
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Delete Project Proposal
  const handleDeleteProject = async (p: ProjectItem) => {
    setProjects((prev) => prev.filter((item) => item.id !== p.id));
    showToast(`Deleted project "${p.title}"`);

    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_PROJECT",
          data: { id: p.id },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Approve / Reject Application
  const handleApplicationAction = async (appId: number, status: "APPROVED" | "REJECTED") => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status } : a))
    );
    showToast(`${status === "APPROVED" ? "Approved" : "Rejected"} team application!`);
  };

  // Filter allotted teams by selected semester
  const filteredAllottedTeams = menteeTeams.filter((t) => {
    if (!t.semester) return selectedAllottedSem === 5;
    return Number(t.semester) === Number(selectedAllottedSem);
  });

  const selectedTeamWorkspace = menteeTeams.find((t) => t.id === selectedTeamWorkspaceId);
  const activeChatTeam = menteeTeams.find((t) => t.id === activeChatTeamId);
  const activeEvalTeam = menteeTeams.find((t) => t.id === activeEvalTeamId);

  // Helper function to render the exact Official GM University Coordinator Rubrics Table Document with Manual Number Inputs
  const renderOfficialCoordinatorRubricDocument = (team: MenteeTeamItem) => {
    const evalData = teamEvaluations[team.id] || {
      criteriaScores: { 1: 9, 2: 8, 3: 9, 4: 8 },
      co5_marks: 17,
      co6_marks: 17,
      remarks: "Excellent performance across CO5 and CO6 criteria.",
      submitted: false,
    };

    // Calculate dynamic total score & max total score
    let totalScore = 0;
    let maxTotalMarks = 0;
    let co5Score = 0;
    let co5Max = 0;
    let co6Score = 0;
    let co6Max = 0;

    publishedRubrics.forEach((crit) => {
      const score = evalData.criteriaScores[crit.id] ?? Math.round(crit.max_marks * 0.8);
      totalScore += score;
      maxTotalMarks += crit.max_marks;
      if (crit.co_code === "CO5") {
        co5Score += score;
        co5Max += crit.max_marks;
      }
      if (crit.co_code === "CO6") {
        co6Score += score;
        co6Max += crit.max_marks;
      }
    });

    return (
      <div id="rubric-document-eval" className="airbnb-card" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000" }}>
        {/* Document Institutional Header */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "16px", marginBottom: "24px" }}>
          <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
          <h1 style={{ margin: "4px 0 2px", fontSize: "26px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h1>
          <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>(Established under the Karnataka State Act No. 19 of 2023)</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px" }}>Post Box no-4, PB Road, Davangere-577006</p>
          <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>FACULTY OF ENGINEERING AND TECHNOLOGY</p>
          <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 800, color: "#c62828" }}>SCST B.Tech CSE</p>
        </div>

        {/* Assessment Document Title */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h2 style={{ textDecoration: "underline", fontSize: "18px", fontWeight: 900, margin: "0 0 10px" }}>
            PROJECT-BASED LEARNING (PBL) ASSESSMENT – Review 3
          </h2>
          <p style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", margin: 0 }}>
            COORDINATOR PUBLISHED RUBRIC ASSESSMENT (TOTAL MARKS: {maxTotalMarks || 40} MARKS):
          </p>
        </div>

        {/* Metadata Information Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", padding: "12px 16px", border: "1px solid #000", background: "#f8fafc" }}>
          <div><strong>Semester:</strong> {team.semester || 5}th Sem</div>
          <div><strong>Section:</strong> {team.section_name}</div>
          <div><strong>Course Code:</strong> UE24CS2406</div>
          <div><strong>Team Code:</strong> {team.team_code}</div>
          <div><strong>Project Title:</strong> {team.project_title}</div>
        </div>

        {/* Official Bloom's Taxonomy Matrix Rubrics Table Created by Coordinator with MANUAL NUMBER INPUTS */}
        <div style={{ overflowX: "auto", marginBottom: "28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                <th style={{ border: "1px solid #000", padding: "10px 6px", width: "45px" }}>CO</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px", width: "160px" }}>Criteria</th>
                <th style={{ border: "1px solid #000", padding: "10px 6px", width: "50px" }}>Max</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 5 (9-10M)</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 4 (7-8M)</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 3 (5-6M)</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 2 (3-4M)</th>
                <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 1 (1-2M)</th>
                <th style={{ border: "1px solid #000", padding: "10px 6px", width: "130px", background: "#e0f2fe" }}>Enter Marks Manually</th>
              </tr>
            </thead>
            <tbody>
              {publishedRubrics.map((c) => {
                const currentVal = evalData.criteriaScores[c.id] ?? Math.round(c.max_marks * 0.8);
                const ratio = c.max_marks > 0 ? currentVal / c.max_marks : 0;

                return (
                  <tr key={c.id} style={{ textAlign: "left", verticalAlign: "top" }}>
                    <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>
                      <span style={{ padding: "2px 6px", background: c.co_code === "CO5" ? "#e7f3ff" : "#e7f7ef", color: c.co_code === "CO5" ? "#1877f2" : "#0f8a5f", borderRadius: "4px" }}>
                        {c.co_code}
                      </span>
                    </td>
                    <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800, color: "#1c1e21" }}>
                      {c.name}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>
                      {c.max_marks} M
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", background: ratio >= 0.85 ? "#dcfce7" : "transparent" }}>
                      <span style={{ fontSize: "11px" }}>{c.level5_desc || `Executes exceptional ${c.name}`}</span>
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", background: ratio >= 0.65 && ratio < 0.85 ? "#dcfce7" : "transparent" }}>
                      <span style={{ fontSize: "11px" }}>{c.level4_desc || `Performs thorough ${c.name}`}</span>
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", background: ratio >= 0.45 && ratio < 0.65 ? "#dcfce7" : "transparent" }}>
                      <span style={{ fontSize: "11px" }}>{c.level3_desc || `Conducts effective ${c.name}`}</span>
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", background: ratio >= 0.25 && ratio < 0.45 ? "#dcfce7" : "transparent" }}>
                      <span style={{ fontSize: "11px" }}>{c.level2_desc || `Applies basic ${c.name}`}</span>
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", background: ratio > 0 && ratio < 0.25 ? "#dcfce7" : "transparent" }}>
                      <span style={{ fontSize: "11px" }}>{c.level1_desc || `Shows limited ${c.name}`}</span>
                    </td>
                    {/* MANUAL NUMBER INPUT CELL (No dropdown!) */}
                    <td style={{ border: "1px solid #000", padding: "10px 8px", background: "#f0f9ff", textAlign: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <input
                          type="number"
                          min="0"
                          max={c.max_marks}
                          value={currentVal}
                          onChange={(e) => {
                            const val = Math.min(c.max_marks, Math.max(0, Number(e.target.value) || 0));
                            setTeamEvaluations((prev) => ({
                              ...prev,
                              [team.id]: {
                                ...(prev[team.id] || { criteriaScores: {}, co5_marks: 0, co6_marks: 0, remarks: "", submitted: false }),
                                criteriaScores: {
                                  ...(prev[team.id]?.criteriaScores || {}),
                                  [c.id]: val,
                                },
                              },
                            }));
                          }}
                          style={{
                            width: "72px",
                            padding: "8px",
                            fontSize: "16px",
                            fontWeight: 900,
                            textAlign: "center",
                            borderRadius: "8px",
                            border: "2px solid #2563eb",
                            background: "#ffffff",
                            outline: "none",
                          }}
                        />
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#475569" }}>
                          / {c.max_marks} Marks
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Instructions & Regulations Note */}
        <div style={{ fontSize: "12px", marginBottom: "24px", lineHeight: "1.6", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
          <strong>Evaluation Note & Regulations:</strong>
          <ol style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
            <li>Faculty members can manually enter any assigned mark up to the maximum criteria limit.</li>
            <li>Students who have not met the guides regularly will be awarded <strong>zero marks</strong>.</li>
            <li>Students who do not present their project progress according to the format or miss presentation will be awarded <strong>zero marks</strong>.</li>
          </ol>
        </div>

        {/* Student Team Member Marks Allocation Table */}
        <div style={{ marginBottom: "28px" }}>
          <h3 style={{ fontWeight: 800, fontSize: "14px", margin: "0 0 10px" }}>
            Student Team Roster Marks Allocation ({team.team_name})
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                <th style={{ border: "1px solid #000", padding: "8px" }}>Student Name / Role</th>
                <th style={{ border: "1px solid #000", padding: "8px" }}>USN</th>
                <th style={{ border: "1px solid #000", padding: "8px" }}>CO5 Score (Max {co5Max || 20}M)</th>
                <th style={{ border: "1px solid #000", padding: "8px" }}>CO6 Score (Max {co6Max || 20}M)</th>
                <th style={{ border: "1px solid #000", padding: "8px", background: "#dcfce7" }}>Total Score (Max {maxTotalMarks || 40}M)</th>
              </tr>
            </thead>
            <tbody>
              {team.usn_list.split(",").map((usn, idx) => (
                <tr key={idx} style={{ textAlign: "center" }}>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "left", fontWeight: 700 }}>
                    {idx === 0 ? `👑 ${team.leader_name} (Leader)` : `🎓 Student Member #${idx + 1}`}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontFamily: "monospace", fontWeight: 700 }}>
                    {usn.trim()}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontWeight: 800, color: "#1d4ed8" }}>
                    {co5Score} / {co5Max || 20} Marks
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontWeight: 800, color: "#0f766e" }}>
                    {co6Score} / {co6Max || 20} Marks
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontWeight: 900, fontSize: "14px", color: "#059669", background: "#f0fdf4" }}>
                    {totalScore} / {maxTotalMarks || 40} Marks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Faculty Feedback & Declaration Block */}
        <form onSubmit={(e) => handleSaveTeamEvaluation(e, team.id)}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "14px", fontWeight: 800, display: "block", marginBottom: "6px" }}>
              Faculty Guide Assessment Feedback & Remarks:
            </label>
            <textarea
              rows={3}
              placeholder={`Enter specific evaluation remarks for ${team.team_name}...`}
              value={evalData.remarks || ""}
              onChange={(e) => {
                const text = e.target.value;
                setTeamEvaluations((prev) => ({
                  ...prev,
                  [team.id]: {
                    ...(prev[team.id] || { criteriaScores: {}, co5_marks: 0, co6_marks: 0, remarks: "", submitted: false }),
                    remarks: text,
                  },
                }));
              }}
              style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #000", fontSize: "13px" }}
            />
          </div>

          <div style={{ borderTop: "2px solid #000", paddingTop: "18px", marginTop: "24px" }}>
            <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "20px" }}>
              I hereby declare that I have conducted the Review 3 presentation of the students, analyzed their progress, and evaluated their performance according to the Coordinator Published Rubric criteria. The marks have been entered as per their performance.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Total Final Score Assigned:</span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#059669", margin: "2px 0 0" }}>
                  {totalScore} / {maxTotalMarks || 40} Marks
                </h2>
              </div>

              <button
                type="submit"
                className="btn-primary-pill"
                style={{ height: "50px", padding: "0 32px", fontSize: "15px", fontWeight: 800, background: "#10b981" }}
              >
                💾 Submit & Lock Marks for {team.team_name}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="airbnb-admin-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`airbnb-toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Navigation Header */}
      <header className="airbnb-header">
        <div className="airbnb-header-container">
          <div className="airbnb-brand">
            <div className="brand-logo-icon" style={{ background: "#3b82f6" }}>👨‍🏫</div>
            <div>
              <span className="brand-title">Falcon PBL Faculty Portal</span>
              <span className="brand-sub">GM University • Dept of CSE</span>
            </div>
          </div>

          <div className="airbnb-header-right">
            {(currentView !== "home" || selectedTeamWorkspaceId !== null || activeChatTeamId !== null || activeEvalTeamId !== null) && (
              <button
                className="action-pill-btn"
                style={{ background: "#f0f2f5", color: "#1c1e21", border: "1px solid #dbdbdb" }}
                onClick={() => {
                  setSelectedTeamWorkspaceId(null);
                  setActiveChatTeamId(null);
                  setActiveEvalTeamId(null);
                  setTeamSubView("hub");
                  setCurrentView("home");
                }}
              >
                ← Back to Dashboard
              </button>
            )}

            <div className="cycle-pill-dropdown">
              <span className="cycle-label">PBL Cycle:</span>
              <span style={{ fontWeight: 800, color: "var(--airbnb-dark)", fontSize: "13px" }}>
                2026-27 Academic Cycle 🟢
              </span>
            </div>

            <div className="user-profile-chip">
              <div className="avatar-circle" style={{ background: "#3b82f6" }}>👨‍🏫</div>
              <div className="chip-details">
                <span className="chip-name">{displayName}</span>
                <span className="chip-status">Role: Faculty & Guide</span>
              </div>
            </div>

            <form action="/api/auth/logout" method="post" style={{ margin: 0 }}>
              <button
                type="submit"
                className="action-pill-btn"
                style={{
                  background: "#ffebe9",
                  color: "#c62828",
                  borderColor: "#ffcdd2",
                  fontWeight: 700,
                }}
              >
                🚪 Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ================= TEAM WORKSPACE PAGE: CLICKING TEAM NAME OPENS THIS ================= */}
      {selectedTeamWorkspaceId !== null && selectedTeamWorkspace && (
        <div className="airbnb-container">
          {/* SUB-VIEW 1: HUB PAGE WITH 2 BIG CARDS */}
          {teamSubView === "hub" && (
            <div>
              <div className="full-page-header">
                <button className="back-btn-pill" onClick={() => setSelectedTeamWorkspaceId(null)}>
                  ← Back to Allotted Teams Directory
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div>
                    <h1 className="full-page-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      🏆 {selectedTeamWorkspace.team_name} ({selectedTeamWorkspace.team_code})
                    </h1>
                    <p className="full-page-desc">
                      Section {selectedTeamWorkspace.section_name} • Semester {selectedTeamWorkspace.semester || 5} • Assigned Project: <strong>{selectedTeamWorkspace.project_title}</strong>
                    </p>
                  </div>

                  <span className="status-badge-active" style={{ fontSize: "13px", padding: "8px 16px" }}>
                    🟢 Team Workspace Active
                  </span>
                </div>
              </div>

              {/* Roster Bar */}
              <div className="airbnb-card" style={{ marginBottom: "24px", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Team Leader & Roster:</span>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--airbnb-dark)", marginTop: "2px" }}>
                      👑 {selectedTeamWorkspace.leader_name} • <code>{selectedTeamWorkspace.usn_list}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2 Big Separate Feature Choice Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* CARD 1: TEAM GUIDANCE CHAT ROOM PAGE */}
                <div
                  className="airbnb-card"
                  style={{
                    padding: "32px",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    border: "2px solid #3b82f6",
                    background: "linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)",
                  }}
                  onClick={() => setTeamSubView("chat")}
                >
                  <div style={{ fontSize: "42px", marginBottom: "16px" }}>💬</div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "var(--airbnb-dark)" }}>
                    Team Guidance Chat Room Page
                  </h2>
                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 24px" }}>
                    Open dedicated separate page for direct live conversation, guidance instructions, and file notes between Guide {displayName} and team members.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>
                      {(teamChatMessages[selectedTeamWorkspace.id] || []).length} Messages in Chat Thread
                    </span>
                    <button type="button" className="btn-primary-pill" style={{ background: "#2563eb", padding: "10px 20px" }}>
                      🚀 Open Chat Room Page →
                    </button>
                  </div>
                </div>

                {/* CARD 2: RUBRICS EVALUATION & MARKS ALLOCATION PAGE */}
                <div
                  className="airbnb-card"
                  style={{
                    padding: "32px",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    border: "2px solid #10b981",
                    background: "linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)",
                  }}
                  onClick={() => setTeamSubView("eval")}
                >
                  <div style={{ fontSize: "42px", marginBottom: "16px" }}>📊</div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "var(--airbnb-dark)" }}>
                    Coordinator Rubrics Evaluation & Marks Allocation
                  </h2>
                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: "0 0 24px" }}>
                    Open dedicated separate page rendering the exact GM University Rubric Document matrix created & published by Coordinator.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#059669" }}>
                      Manual Number Input Grading
                    </span>
                    <button type="button" className="btn-primary-pill" style={{ background: "#10b981", padding: "10px 20px" }}>
                      🚀 Open Evaluation Page →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: DEDICATED CHAT ROOM PAGE */}
          {teamSubView === "chat" && (
            <div>
              <div className="full-page-header">
                <button className="back-btn-pill" onClick={() => setTeamSubView("hub")}>
                  ← Back to {selectedTeamWorkspace.team_name} Workspace
                </button>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div>
                    <h1 className="full-page-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      💬 {selectedTeamWorkspace.team_name} — Team Conversation Room
                    </h1>
                    <p className="full-page-desc">
                      Dedicated guidance chat room between Guide <strong>{displayName}</strong> and team members.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
                {/* Left Sidebar */}
                <div className="airbnb-card" style={{ height: "fit-content" }}>
                  <div style={{ paddingBottom: "16px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
                    <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "12px" }}>
                      Section {selectedTeamWorkspace.section_name} • Semester {selectedTeamWorkspace.semester || 5}
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "8px 0 4px", color: "var(--airbnb-dark)" }}>
                      {selectedTeamWorkspace.team_name}
                    </h2>
                    <code style={{ fontSize: "13px", color: "#64748b" }}>{selectedTeamWorkspace.team_code}</code>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: 800, marginBottom: "8px" }}>
                      Assigned Project Title
                    </h3>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--airbnb-dark)", margin: 0, lineHeight: "1.4" }}>
                      {selectedTeamWorkspace.project_title}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: 800, marginBottom: "12px" }}>
                      Team Members ({selectedTeamWorkspace.usn_list.split(",").length} Members)
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <strong style={{ fontSize: "13px", display: "block", color: "var(--airbnb-dark)" }}>
                            👑 {selectedTeamWorkspace.leader_name}
                          </strong>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Team Leader</span>
                        </div>
                        <span style={{ fontSize: "11px", background: "#e7f7ef", color: "#0f8a5f", padding: "2px 8px", borderRadius: "10px", fontWeight: 700, marginLeft: "auto" }}>
                          ONLINE
                        </span>
                      </div>

                      {selectedTeamWorkspace.usn_list.split(",").map((usn, idx) => (
                        <div key={idx} style={{ padding: "8px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "var(--airbnb-dark)" }}>
                            🎓 {usn.trim()}
                          </span>
                          <span style={{ fontSize: "10px", color: "#94a3b8" }}>Member #{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Chat Area */}
                <div className="airbnb-card" style={{ display: "flex", flexDirection: "column", minHeight: "560px" }}>
                  <div style={{ paddingBottom: "14px", borderBottom: "1px solid #e2e8f0", marginBottom: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--airbnb-dark)" }}>
                      💬 Conversation Thread ({selectedTeamWorkspace.team_name})
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {(teamChatMessages[selectedTeamWorkspace.id] || []).length} Messages
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px", paddingRight: "8px" }}>
                    {(teamChatMessages[selectedTeamWorkspace.id] || []).map((msg) => {
                      const isFaculty = msg.sender_role === "FACULTY";

                      return (
                        <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isFaculty ? "flex-end" : "flex-start" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: isFaculty ? "#1d4ed8" : "#0f766e" }}>
                              {isFaculty ? `👨‍🏫 ${msg.sender_name} (Guide)` : `👨‍🎓 ${msg.sender_name}`}
                            </span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{msg.timestamp}</span>
                          </div>
                          <div
                            style={{
                              maxWidth: "80%",
                              padding: "14px 18px",
                              borderRadius: isFaculty ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                              background: isFaculty ? "#eff6ff" : "#f8fafc",
                              color: "var(--airbnb-dark)",
                              border: isFaculty ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                              fontSize: "14px",
                              lineHeight: "1.5",
                            }}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={(e) => handleSendChatMessage(e, selectedTeamWorkspace.id)} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                      <div style={{ flex: 1 }}>
                        <textarea
                          rows={2}
                          placeholder={`Write guidance message to ${selectedTeamWorkspace.team_name}...`}
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #cbd5e1", fontSize: "14px" }}
                        />
                      </div>
                      <button type="submit" className="btn-primary-pill" style={{ height: "52px", padding: "0 24px", background: "#3b82f6", fontWeight: 800 }}>
                        🚀 Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: DEDICATED RUBRICS EVALUATION PAGE (EXACT COORDINATOR DOCUMENT MATRIX WITH MANUAL NUMBER INPUTS) */}
          {teamSubView === "eval" && (
            <div>
              <div className="full-page-header">
                <button className="back-btn-pill" onClick={() => setTeamSubView("hub")}>
                  ← Back to {selectedTeamWorkspace.team_name} Workspace
                </button>
                <h1 className="full-page-title">
                  📊 {selectedTeamWorkspace.team_name} — Coordinator Published Rubrics Assessment
                </h1>
                <p className="full-page-desc">
                  Official GM University Review 3 Rubric Document matrix created & published by Coordinator.
                </p>
              </div>

              {renderOfficialCoordinatorRubricDocument(selectedTeamWorkspace)}
            </div>
          )}
        </div>
      )}

      {/* ================= STANDALONE PAGE 1: CHAT ROOM DIRECTLY FROM TABLE ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId !== null && activeChatTeam && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setActiveChatTeamId(null)}>
              ← Back to Allotted Teams
            </button>
            <h1 className="full-page-title">💬 {activeChatTeam.team_name} — Team Conversation Room</h1>
            <p className="full-page-desc">Dedicated guidance chat room between Guide <strong>{displayName}</strong> and team members.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px" }}>
            {/* Left Sidebar */}
            <div className="airbnb-card" style={{ height: "fit-content" }}>
              <div style={{ paddingBottom: "16px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "12px" }}>
                  Section {activeChatTeam.section_name} • Semester {activeChatTeam.semester || 5}
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "8px 0 4px", color: "var(--airbnb-dark)" }}>
                  {activeChatTeam.team_name}
                </h2>
                <code style={{ fontSize: "13px", color: "#64748b" }}>{activeChatTeam.team_code}</code>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: 800, marginBottom: "8px" }}>
                  Assigned Project Title
                </h3>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--airbnb-dark)", margin: 0 }}>
                  {activeChatTeam.project_title}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#64748b", fontWeight: 800, marginBottom: "12px" }}>
                  Team Members ({activeChatTeam.usn_list.split(",").length} Members)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <strong style={{ fontSize: "13px", display: "block", color: "var(--airbnb-dark)" }}>
                      👑 {activeChatTeam.leader_name}
                    </strong>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Team Leader</span>
                  </div>

                  {activeChatTeam.usn_list.split(",").map((usn, idx) => (
                    <div key={idx} style={{ padding: "8px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: 700, color: "var(--airbnb-dark)" }}>
                        🎓 {usn.trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Chat Area */}
            <div className="airbnb-card" style={{ display: "flex", flexDirection: "column", minHeight: "560px" }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
                {(teamChatMessages[activeChatTeam.id] || []).map((msg) => {
                  const isFaculty = msg.sender_role === "FACULTY";

                  return (
                    <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isFaculty ? "flex-end" : "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: isFaculty ? "#1d4ed8" : "#0f766e" }}>
                          {isFaculty ? `👨‍🏫 ${msg.sender_name} (Guide)` : `👨‍🎓 ${msg.sender_name}`}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{msg.timestamp}</span>
                      </div>
                      <div
                        style={{
                          maxWidth: "80%",
                          padding: "14px 18px",
                          borderRadius: isFaculty ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                          background: isFaculty ? "#eff6ff" : "#f8fafc",
                          color: "var(--airbnb-dark)",
                          border: isFaculty ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                          fontSize: "14px",
                          lineHeight: "1.5",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={(e) => handleSendChatMessage(e, activeChatTeam.id)} style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <textarea
                      rows={2}
                      placeholder={`Write guidance message to ${activeChatTeam.team_name}...`}
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #cbd5e1", fontSize: "14px" }}
                    />
                  </div>
                  <button type="submit" className="btn-primary-pill" style={{ height: "52px", padding: "0 24px", background: "#3b82f6", fontWeight: 800 }}>
                    🚀 Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= STANDALONE PAGE 2: EVALUATION PAGE DIRECTLY FROM TABLE ================= */}
      {selectedTeamWorkspaceId === null && activeEvalTeamId !== null && activeEvalTeam && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setActiveEvalTeamId(null)}>
              ← Back to Allotted Teams
            </button>
            <h1 className="full-page-title">📊 {activeEvalTeam.team_name} — Coordinator Published Rubrics Assessment</h1>
            <p className="full-page-desc">Official GM University Review 3 Rubric Document matrix created & published by Coordinator.</p>
          </div>

          {renderOfficialCoordinatorRubricDocument(activeEvalTeam)}
        </div>
      )}

      {/* ================= VIEW 1: FACULTY DASHBOARD HOME ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "home" && (
        <div className="airbnb-container">
          <div className="welcome-banner">
            <div>
              <h1 className="welcome-title">Welcome Back, {displayName} 👋</h1>
              <div className="cycle-status-strip">
                <span>👨‍🏫 Faculty Workspace • Active Academic Cycle:</span>
                <span className="status-badge-active">🟢 2026-27 OPEN</span>
              </div>
            </div>
          </div>

          {/* 5 Stats Cards Grid */}
          <div className="stats-grid">
            <div className="airbnb-card stat-card" onClick={() => setCurrentView("myProjects")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">💡</div>
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Published Project Ideas (Click to Manage)</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("menteeTeams")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">👥</div>
              <div className="stat-value">{menteeTeams.length} Teams</div>
              <div className="stat-label">Assigned Mentee Student Teams</div>
            </div>

            <div className="airbnb-card stat-card highlight-card" onClick={() => setCurrentView("allottedTeams")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{menteeTeams.length}</div>
              <div className="stat-label">Allotted Teams (Click to Filter by Sem)</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("applications")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">📝</div>
              <div className="stat-value">{applications.filter((a) => a.status === "PENDING").length} Pending</div>
              <div className="stat-label">Project Choice Applications</div>
            </div>

            <div className="airbnb-card stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">Review 3</div>
              <div className="stat-label">Evaluation & Mark Submission</div>
            </div>
          </div>

          {/* Quick Administrative Actions for Faculty */}
          <div className="airbnb-card vertical-actions-section">
            <div className="timeline-header" style={{ marginBottom: "24px" }}>
              <div>
                <h2 className="timeline-title">⚡ Quick Faculty Actions</h2>
                <p className="timeline-desc">
                  Select a feature below to open its dedicated management view.
                </p>
              </div>
            </div>

            <div className="vertical-actions-grid">
              <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("myProjects")}>
                <div className="action-icon-box coral">💡</div>
                <div className="action-text-box">
                  <div className="action-card-title">Publish & Manage PBL Projects</div>
                  <div className="action-card-sub">Create new project proposals, set domains, and max teams</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("menteeTeams")}>
                <div className="action-icon-box green">👥</div>
                <div className="action-text-box">
                  <div className="action-card-title">Assigned Mentee Student Teams</div>
                  <div className="action-card-sub">View student team rosters, USNs, and open team chat rooms</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("applications")}>
                <div className="action-icon-box blue">📝</div>
                <div className="action-text-box">
                  <div className="action-card-title">Review Student Project Choice Applications</div>
                  <div className="action-card-sub">Approve or reject student team project applications</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("evaluations")}>
                <div className="action-icon-box dark">📊</div>
                <div className="action-text-box">
                  <div className="action-card-title">Rubrics Evaluation & Mark Submission</div>
                  <div className="action-card-sub">Grade student teams for Review 3 (CO5 & CO6 - 40 Marks Total)</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </div>
          </div>

          {/* Standalone Separate Section Card: Allotted Teams by Semester */}
          <div className="airbnb-card vertical-actions-section" style={{ marginTop: "28px" }}>
            <div className="timeline-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="timeline-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  🏆 Allotted Teams by Semester
                </h2>
                <p className="timeline-desc">
                  Select an academic semester from the dropdown below to view all allotted student teams assigned under your supervision.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary-pill"
                style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 800 }}
                onClick={() => setCurrentView("allottedTeams")}
              >
                Open Full Page View →
              </button>
            </div>

            {/* Dropdown Selector Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#f8fafc", padding: "16px 20px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
              <label style={{ fontWeight: 800, fontSize: "14px", color: "var(--airbnb-dark)", whiteSpace: "nowrap" }}>
                Select Semester:
              </label>
              <select
                value={selectedAllottedSem}
                onChange={(e) => setSelectedAllottedSem(Number(e.target.value))}
                style={{
                  flex: 1,
                  padding: "12px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  borderRadius: "12px",
                  border: "2px solid #3b82f6",
                  background: "#ffffff",
                  color: "var(--airbnb-dark)",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(59, 130, 246, 0.1)",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const count = menteeTeams.filter((t) => (t.semester || 5) === sem).length;
                  return (
                    <option key={sem} value={sem}>
                      Semester {sem} — {count > 0 ? `${count} Teams Allotted 🟢` : "0 Teams Allotted ⚪"}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Inline Roster Table for Selected Semester */}
            {filteredAllottedTeams.length > 0 ? (
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team Code</th>
                      <th>Team Name & Leader</th>
                      <th>Student Roster (USNs)</th>
                      <th>Class Section</th>
                      <th>Allotted Project Title</th>
                      <th>Status</th>
                      <th style={{ width: "240px", textAlign: "right" }}>Dedicated Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllottedTeams.map((t) => (
                      <tr key={t.id}>
                        <td><code>{t.team_code}</code></td>
                        <td>
                          <strong style={{ cursor: "pointer", color: "#1877f2" }} onClick={() => { setSelectedTeamWorkspaceId(t.id); setTeamSubView("hub"); }}>
                            {t.team_name}
                          </strong>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                            Leader: {t.leader_name}
                          </span>
                        </td>
                        <td><code>{t.usn_list}</code></td>
                        <td>
                          <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "13px" }}>
                            Section {t.section_name}
                          </span>
                        </td>
                        <td><strong>{t.project_title}</strong></td>
                        <td>
                          <span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>
                            {t.status} 🟢
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#3b82f6" }}
                              onClick={() => setActiveChatTeamId(t.id)}
                            >
                              💬 Chat Room
                            </button>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                              onClick={() => setActiveEvalTeamId(t.id)}
                            >
                              📊 Evaluation Page
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: "28px", marginBottom: "6px" }}>⚪</div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 4px", color: "var(--airbnb-dark)" }}>
                  No Student Teams Allotted for Semester {selectedAllottedSem} Yet
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--airbnb-gray)" }}>
                  Select another semester from the dropdown above to view assigned mentee teams.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: MY PUBLISHED PROJECTS ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "myProjects" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">💡 My Published PBL Project Ideas</h1>
            <p className="full-page-desc">Create, publish, and manage project proposals available for student team selection.</p>
          </div>

          {/* Top Form: Publish New Project Proposal */}
          <div className="airbnb-card" style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>➕ Publish New Project Idea</h2>
            <form onSubmit={handlePublishProject} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. AI-Powered Healthcare Diagnostic Portal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Domain</label>
                <select value={domain} onChange={(e) => setDomain(e.target.value)}>
                  <option value="Artificial Intelligence">Artificial Intelligence & ML</option>
                  <option value="Web Engineering">Web Engineering & Cloud</option>
                  <option value="IoT">IoT & Embedded Systems</option>
                  <option value="Cybersecurity">Cybersecurity & Blockchain</option>
                  <option value="Data Analytics">Data Analytics & Big Data</option>
                </select>
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Technology Stack</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, FastAPI, PostgreSQL, Python"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Max Teams Allowed</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(Number(e.target.value))}
                  required
                />
              </div>

              <div className="modal-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                <label>Short Description & Project Objectives</label>
                <textarea
                  placeholder="Brief explanation of the project problem statement and expected deliverables..."
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #dbdbdb" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", textAlign: "right" }}>
                <button type="submit" className="btn-primary-pill" style={{ height: "46px", padding: "0 28px" }}>
                  🚀 Publish Project Proposal
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Table: Published Projects Directory */}
          <div className="airbnb-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                Published Proposals ({projects.length} Projects)
              </h2>
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Title & Description</th>
                    <th>Domain</th>
                    <th>Tech Stack</th>
                    <th>Max Teams</th>
                    <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const isEditing = editingProjectId === p.id;

                    return (
                      <tr key={p.id}>
                        <td><code>PRJ{String(p.id).padStart(3, "0")}</code></td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              style={{ padding: "6px 10px", fontSize: "14px", fontWeight: 700, width: "100%" }}
                            />
                          ) : (
                            <div>
                              <strong>{p.title}</strong>
                              <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                                {p.short_description || p.description || p.title}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDomain}
                              onChange={(e) => setEditDomain(e.target.value)}
                              style={{ padding: "6px 10px", fontSize: "13px" }}
                            />
                          ) : (
                            <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>
                              {p.domain}
                            </span>
                          )}
                        </td>
                        <td>{p.technology_stack || "Next.js, PostgreSQL"}</td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={editMaxTeams}
                              onChange={(e) => setEditMaxTeams(Number(e.target.value))}
                              style={{ padding: "6px", width: "60px" }}
                            />
                          ) : (
                            <strong>{p.max_teams} Teams</strong>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isEditing ? (
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="btn-primary-pill"
                                style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                                onClick={() => handleSaveProjectEdit(p)}
                              >
                                💾 Save
                              </button>
                              <button
                                type="button"
                                className="btn-secondary-pill"
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                onClick={() => setEditingProjectId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="btn-secondary-pill"
                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                onClick={() => {
                                  setEditingProjectId(p.id);
                                  setEditTitle(p.title);
                                  setEditDomain(p.domain);
                                  setEditTechStack(p.technology_stack || "");
                                  setEditMaxTeams(p.max_teams);
                                }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                className="btn-secondary-pill"
                                style={{ padding: "6px 12px", fontSize: "12px", background: "#ffebe9", color: "#c62828", borderColor: "#ffcdd2" }}
                                onClick={() => handleDeleteProject(p)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: ALLOTTED TEAMS BY SEMESTER ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "allottedTeams" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">🏆 Allotted Student Teams by Semester</h1>
            <p className="full-page-desc">Select a semester below to open its dedicated allotted teams page and view all mentee teams assigned under your supervision.</p>
          </div>

          {/* Semester Selector Dropdown Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#ffffff", padding: "18px 24px", borderRadius: "16px", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", marginBottom: "28px" }}>
            <label style={{ fontWeight: 800, fontSize: "15px", color: "var(--airbnb-dark)", whiteSpace: "nowrap" }}>
              🎓 Select Semester View:
            </label>
            <select
              value={selectedAllottedSem}
              onChange={(e) => setSelectedAllottedSem(Number(e.target.value))}
              style={{
                flex: 1,
                padding: "12px 18px",
                fontSize: "15px",
                fontWeight: 800,
                borderRadius: "12px",
                border: "2px solid #3b82f6",
                background: "#ffffff",
                color: "var(--airbnb-dark)",
                cursor: "pointer",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const count = menteeTeams.filter((t) => (t.semester || 5) === sem).length;
                return (
                  <option key={sem} value={sem}>
                    Semester {sem} — {count > 0 ? `${count} Teams Allotted 🟢` : "0 Teams Allotted ⚪"}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Semester Dedicated Page Box */}
          <div className="airbnb-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 4px", color: "var(--airbnb-dark)" }}>
                  Semester {selectedAllottedSem} Allotted Teams ({filteredAllottedTeams.length} Teams)
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--airbnb-gray)" }}>
                  Showing all student teams allotted for Semester {selectedAllottedSem} under guide {displayName}.
                </p>
              </div>

              <span className="status-badge-active" style={{ fontSize: "13px", padding: "6px 14px" }}>
                🟢 {filteredAllottedTeams.length} Teams Active
              </span>
            </div>

            {filteredAllottedTeams.length > 0 ? (
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team Code</th>
                      <th>Team Name & Leader</th>
                      <th>Student Roster (USNs)</th>
                      <th>Class Section</th>
                      <th>Allotted Project Title</th>
                      <th>Status</th>
                      <th style={{ width: "240px", textAlign: "right" }}>Dedicated Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllottedTeams.map((t) => (
                      <tr key={t.id}>
                        <td><code>{t.team_code}</code></td>
                        <td>
                          <strong style={{ cursor: "pointer", color: "#1877f2" }} onClick={() => { setSelectedTeamWorkspaceId(t.id); setTeamSubView("hub"); }}>
                            {t.team_name}
                          </strong>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                            Leader: {t.leader_name}
                          </span>
                        </td>
                        <td><code>{t.usn_list}</code></td>
                        <td>
                          <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "13px" }}>
                            Section {t.section_name}
                          </span>
                        </td>
                        <td><strong>{t.project_title}</strong></td>
                        <td>
                          <span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>
                            {t.status} 🟢
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#3b82f6" }}
                              onClick={() => setActiveChatTeamId(t.id)}
                            >
                              💬 Chat Room
                            </button>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                              onClick={() => setActiveEvalTeamId(t.id)}
                            >
                              📊 Evaluation Page
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", background: "#f8fafc", borderRadius: "14px", border: "1px dashed #cbd5e1" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚪</div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 4px", color: "var(--airbnb-dark)" }}>
                  No Teams Allotted for Semester {selectedAllottedSem} Yet
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--airbnb-gray)" }}>
                  Select another semester from the dropdown above to view assigned mentee teams.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 4: MENTEE STUDENT TEAMS ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "menteeTeams" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">👥 Assigned Mentee Student Teams</h1>
            <p className="full-page-desc">View student team rosters, section allocations, and assigned project topics under your mentorship.</p>
          </div>

          <div className="airbnb-card">
            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team Code</th>
                    <th>Team Name & Leader</th>
                    <th>Student Roster (USNs)</th>
                    <th>Section</th>
                    <th>Assigned Project Title</th>
                    <th>Status</th>
                    <th style={{ width: "240px", textAlign: "right" }}>Dedicated Pages</th>
                  </tr>
                </thead>
                <tbody>
                  {menteeTeams.map((t) => (
                    <tr key={t.id}>
                      <td><code>{t.team_code}</code></td>
                      <td>
                        <strong style={{ cursor: "pointer", color: "#1877f2" }} onClick={() => { setSelectedTeamWorkspaceId(t.id); setTeamSubView("hub"); }}>
                          {t.team_name}
                        </strong>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>Leader: {t.leader_name}</span>
                      </td>
                      <td><code>{t.usn_list}</code></td>
                      <td><span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>Section {t.section_name}</span></td>
                      <td><strong>{t.project_title}</strong></td>
                      <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>{t.status} 🟢</span></td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-primary-pill"
                            style={{ padding: "6px 12px", fontSize: "12px", background: "#3b82f6" }}
                            onClick={() => setActiveChatTeamId(t.id)}
                          >
                            💬 Chat Room
                          </button>
                          <button
                            type="button"
                            className="btn-primary-pill"
                            style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                            onClick={() => setActiveEvalTeamId(t.id)}
                          >
                            📊 Evaluation Page
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 5: APPLICATIONS REVIEW ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "applications" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📝 Student Project Choice Applications</h1>
            <p className="full-page-desc">Review and approve team applications submitted for your published project proposals.</p>
          </div>

          <div className="airbnb-card">
            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Student Team Name</th>
                    <th>Applied Project Proposal</th>
                    <th>Preference Rank</th>
                    <th>Submission Date</th>
                    <th>Application Status</th>
                    <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td><code>APP#{app.id}</code></td>
                      <td><strong>{app.team_name}</strong></td>
                      <td><strong>{app.project_title}</strong></td>
                      <td><span className="action-tag" style={{ background: "#f0f2f5", color: "#1c1e21" }}>Rank #{app.preference_rank}</span></td>
                      <td>{app.submitted_at}</td>
                      <td>
                        <span
                          className="legend-item"
                          style={{
                            background: app.status === "APPROVED" ? "#e7f7ef" : app.status === "REJECTED" ? "#ffebe9" : "#fff8e6",
                            color: app.status === "APPROVED" ? "#0f8a5f" : app.status === "REJECTED" ? "#c62828" : "#b7791f",
                            fontWeight: 800,
                          }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {app.status === "PENDING" ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                              onClick={() => handleApplicationAction(app.id, "APPROVED")}
                            >
                              ✅ Approve
                            </button>
                            <button
                              type="button"
                              className="btn-secondary-pill"
                              style={{ padding: "6px 12px", fontSize: "12px", background: "#ffebe9", color: "#c62828", borderColor: "#ffcdd2" }}
                              onClick={() => handleApplicationAction(app.id, "REJECTED")}
                            >
                              ❌ Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--airbnb-gray)" }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 6: GLOBAL EVALUATION & MARK SUBMISSION ================= */}
      {selectedTeamWorkspaceId === null && activeChatTeamId === null && activeEvalTeamId === null && currentView === "evaluations" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📊 Review 3 Rubric Evaluation & Mark Submission</h1>
            <p className="full-page-desc">Grade mentee student teams using the official GM University Rubric Document format.</p>
          </div>

          {renderOfficialCoordinatorRubricDocument(menteeTeams.find((t) => t.id === Number(selectedTeamId)) || menteeTeams[0])}
        </div>
      )}
    </div>
  );
}
