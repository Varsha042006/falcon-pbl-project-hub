"use client";

import { useState } from "react";

export interface MentorTeamItem {
  id: number;
  team_code: string;
  team_name: string;
  leader_name: string;
  usn_list: string;
  section_name: string;
  semester?: number;
  project_title: string;
  status: string;
  guide_name: string;
  co5_marks: number;
  co6_marks: number;
  total_marks: number;
  max_marks: number;
  evaluation_status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  mentor_remarks: string;
  mentor_signature: string;
}

interface AirbnbMentorDashboardProps {
  displayName: string;
  teams: MentorTeamItem[];
}

type MentorView = "home" | "teamWorkspace" | "reviewMarks" | "approveReject" | "addRemarks" | "digitalSignature" | "teamReports";

export function AirbnbMentorDashboard({ displayName, teams: initialTeams }: AirbnbMentorDashboardProps) {
  const [currentView, setCurrentView] = useState<MentorView>("home");
  const [teams, setTeams] = useState<MentorTeamItem[]>(initialTeams);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"actions" | "rubricDoc">("actions");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pendingCount = teams.filter((t) => t.evaluation_status === "SUBMITTED").length;
  const approvedCount = teams.filter((t) => t.evaluation_status === "APPROVED").length;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleApprove = (teamId: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, evaluation_status: "APPROVED" as const } : t))
    );
    showToast("Team evaluation approved successfully!");
  };

  const handleReject = (teamId: number) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, evaluation_status: "REJECTED" as const } : t))
    );
    showToast("Team evaluation rejected.", "error");
  };

  const handleSaveRemarks = (teamId: number, remarks: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, mentor_remarks: remarks } : t))
    );
    showToast("Remarks saved successfully!");
  };

  const handleSignature = (teamId: number, signature: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, mentor_signature: signature, evaluation_status: "APPROVED" as const } : t))
    );
    showToast("Digital signature applied & evaluation locked!");
  };

  // Render 2-Page Official Rubric & Report Document for a team
  const renderOfficialRubricDocument = (team: MentorTeamItem) => {
    const usnArray = team.usn_list ? team.usn_list.split(",") : [];

    return (
      <div style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }} className="no-print">
          <button
            type="button"
            className="btn-primary-pill"
            style={{ background: "#10b981", color: "#ffffff", padding: "10px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}
            onClick={() => window.print()}
          >
            📥 Download / Print 2-Page Rubric Document (PDF)
          </button>
        </div>

        {/* ===== PAGE 1: Rubrics Matrix & Regulations ===== */}
        <div id="rubric-document-eval" className="airbnb-card" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "16px", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
            <h1 style={{ margin: "4px 0 2px", fontSize: "26px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h1>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>(Established under the Karnataka State Act No. 19 of 2023)</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px" }}>Post Box no-4, PB Road, Davangere-577006</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>FACULTY OF ENGINEERING AND TECHNOLOGY</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 800, color: "#c62828" }}>SCST B.Tech CSE</p>
          </div>

          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ textDecoration: "underline", fontSize: "18px", fontWeight: 900, margin: "0 0 10px" }}>
              PROJECT-BASED LEARNING (PBL) ASSESSMENT – Review 3
            </h2>
            <p style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", margin: 0 }}>
              COORDINATOR PUBLISHED RUBRIC ASSESSMENT (TOTAL MARKS: {team.max_marks} MARKS):
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", padding: "12px 16px", border: "1px solid #000", background: "#f8fafc" }}>
            <div><strong>Semester:</strong> {team.semester || 5}th Sem</div>
            <div><strong>Section:</strong> {team.section_name}</div>
            <div><strong>Course Code:</strong> UE24CS2406</div>
            <div><strong>Team Code:</strong> {team.team_code}</div>
            <div><strong>Project Title:</strong> {team.project_title}</div>
          </div>

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
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO5</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>System Architecture & Implementation</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>20</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Executes exceptional modular architecture (18-20M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Performs thorough implementation (14-17M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Conducts effective basic build (10-13M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Applies partial logic (6-9M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Shows limited prototype (1-5M)</td>
                </tr>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO6</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>Demonstration & Defense</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>20</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Fluent defense & live demo (18-20M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Clear explanation of code (14-17M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Satisfactory response to questions (10-13M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Basic presentation (6-9M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Minimal demo (1-5M)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: "12px", marginBottom: "24px", lineHeight: "1.6" }}>
            <strong>Note:</strong>
            <ol style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
              <li>Students who have not met the guides regularly will be awarded <strong>zero marks</strong>.</li>
              <li>Students who do not present their project progress according to the format or miss presentation will be awarded <strong>zero marks</strong>.</li>
            </ol>
          </div>
        </div>

        {/* ===== PAGE 2: Student Marks Allocation, Remarks & Signatures ===== */}
        <div className="airbnb-card" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000", marginTop: "32px", pageBreakBefore: "always", breakBefore: "page" as never }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
            <h2 style={{ margin: "4px 0 2px", fontSize: "20px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>PBL ASSESSMENT – Review 3 (Page 2: Student Marks & Declaration)</p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontWeight: 800, fontSize: "14px", margin: "0 0 10px" }}>
              <strong>Project Name:</strong> {team.project_title}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "center" }}>
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>Student Name</th>
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>USN</th>
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>CO5 (20 Marks)</th>
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>CO6 (20 Marks)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const usn = usnArray[idx]?.trim() || "";
                  const studentName = idx === 0 && usn ? `${team.leader_name} (Team Lead)` : (usn ? `Student Member #${idx + 1}` : "");
                  return (
                    <tr key={idx} style={{ textAlign: "center" }}>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>
                        {studentName || "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontFamily: "monospace", fontWeight: 700 }}>
                        {usn || "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800, color: "#1d4ed8" }}>
                        {usn ? `${team.co5_marks} Marks` : "—"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800, color: "#0f766e" }}>
                        {usn ? `${team.co6_marks} Marks` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Remarks Section */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 800, display: "block", marginBottom: "6px" }}>
              Faculty Guide & Mentor Assessment Feedback Remarks:
            </label>
            <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid #000", fontSize: "13px", background: "#fafafa" }}>
              {team.mentor_remarks || "No remarks entered."}
            </div>
          </div>

          <div style={{ borderTop: "2px solid #000", paddingTop: "18px", marginTop: "24px" }}>
            <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "20px" }}>
              I hereby declare that I have conducted the Review 3 presentation of the students, analyzed their progress, and evaluated their performance according to the Coordinator Published Rubric criteria.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px", maxWidth: "400px" }}>
              <div>
                <strong style={{ fontSize: "13px" }}>Guide Name:</strong> {team.guide_name}
              </div>
              <div>
                <strong style={{ fontSize: "13px" }}>Faculty Mentor Signature:</strong> {team.mentor_signature || "______________________"}
              </div>
              <div>
                <strong style={{ fontSize: "13px" }}>Evaluation Status:</strong>{" "}
                <span className="legend-item" style={{
                  background: team.evaluation_status === "APPROVED" ? "#dcfce7" : "#fef9c3",
                  color: team.evaluation_status === "APPROVED" ? "#0f8a5f" : "#a16207",
                  fontWeight: 800,
                }}>
                  {team.evaluation_status}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Total Final Score Assigned:</span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#059669", margin: "2px 0 0" }}>
                  {team.total_marks} / {team.max_marks} Marks
                </h2>
              </div>
            </div>
          </div>
        </div>
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
            <div className="brand-logo-icon" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>👨‍🏫</div>
            <div>
              <span className="brand-title">Falcon PBL Faculty Mentor Portal</span>
              <span className="brand-sub">GM University • Dept of CSE</span>
            </div>
          </div>
          <div className="header-actions">
            <span className="user-badge">👨‍🏫 {displayName}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="logout-btn">Logout</button>
            </form>
          </div>
        </div>
      </header>

      {/* Back Button for Sub-Views */}
      {currentView !== "home" && (
        <div className="airbnb-container" style={{ paddingBottom: 0 }}>
          <button className="back-btn-pill" onClick={() => { setCurrentView("home"); setSelectedTeamId(null); }}>
            ← Back to Faculty Mentor Dashboard
          </button>
        </div>
      )}

      {/* ================= HOME VIEW ================= */}
      {currentView === "home" && (
        <div className="airbnb-container">
          <div className="welcome-banner">
            <div>
              <h1 className="welcome-title">Welcome Back, {displayName} 👋</h1>
              <div className="cycle-status-strip">
                <span>👨‍🏫 Faculty Mentor Workspace • Academic Cycle:</span>
                <span className="status-badge-active">🟢 2026-27 OPEN</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="airbnb-card stat-card" onClick={() => setCurrentView("reviewMarks")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">📊</div>
              <div className="stat-value">{teams.length}</div>
              <div className="stat-label">Total Assigned Teams</div>
            </div>

            <div className="airbnb-card stat-card highlight-card" onClick={() => setCurrentView("approveReject")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-label">Pending Reviews</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("approveReject")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">✅</div>
              <div className="stat-value">{approvedCount}</div>
              <div className="stat-label">Approved Evaluations</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("teamReports")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">📄</div>
              <div className="stat-value">{teams.length}</div>
              <div className="stat-label">Team Reports Available</div>
            </div>
          </div>

          {/* ================= SEPARATE DIV: FACULTY APPROVED TEAM PROJECTS ================= */}
          <div className="airbnb-card vertical-actions-section" style={{ marginBottom: "28px" }}>
            <div className="timeline-header" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="timeline-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  🏆 Faculty Approved Team Projects
                </h2>
                <p className="timeline-desc">
                  Select any faculty approved student team project to open its dedicated workspace, review marks, add remarks, apply digital signatures, and view 2-page rubric reports.
                </p>
              </div>
            </div>

            {/* Approved Teams Table / Cards */}
            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team Code</th>
                    <th>Team Name & Leader</th>
                    <th>Project Title</th>
                    <th>Faculty Guide</th>
                    <th>Section</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td><code>{t.team_code}</code></td>
                      <td>
                        <strong style={{ color: "#7c3aed" }}>{t.team_name}</strong>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>Leader: {t.leader_name}</span>
                      </td>
                      <td><strong>{t.project_title}</strong></td>
                      <td><span className="action-tag" style={{ background: "#f0f4ff", color: "#3b82f6" }}>{t.guide_name}</span></td>
                      <td><strong>{t.section_name}</strong> ({t.semester || 5}th Sem)</td>
                      <td>
                        <span className="legend-item" style={{
                          background: t.evaluation_status === "APPROVED" ? "#dcfce7" : t.evaluation_status === "REJECTED" ? "#fee2e2" : "#fef9c3",
                          color: t.evaluation_status === "APPROVED" ? "#0f8a5f" : t.evaluation_status === "REJECTED" ? "#dc2626" : "#a16207",
                          fontWeight: 800,
                        }}>
                          {t.evaluation_status === "APPROVED" ? "✅ " : t.evaluation_status === "REJECTED" ? "❌ " : "⏳ "}
                          {t.evaluation_status}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn-primary-pill"
                          style={{ padding: "8px 18px", fontSize: "12px", background: "#7c3aed", fontWeight: 800 }}
                          onClick={() => {
                            setSelectedTeamId(t.id);
                            setCurrentView("teamWorkspace");
                            setWorkspaceTab("actions");
                          }}
                        >
                          🚀 Workspace & Actions
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions Grid matching the image */}
          <div className="airbnb-card vertical-actions-section">
            <div className="timeline-header" style={{ marginBottom: "24px" }}>
              <div>
                <h2 className="timeline-title">⚡ Faculty Mentor Quick Actions</h2>
                <p className="timeline-desc">Select a feature below to manage mentee team evaluations across all projects.</p>
              </div>
            </div>

            <div className="vertical-actions-grid">
              <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("reviewMarks")}>
                <div className="action-icon-box coral">📊</div>
                <div className="action-text-box">
                  <div className="action-card-title">Review Marks</div>
                  <div className="action-card-sub">View and review marks submitted by faculty guides</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("approveReject")}>
                <div className="action-icon-box green">✅</div>
                <div className="action-text-box">
                  <div className="action-card-title">Approve / Reject</div>
                  <div className="action-card-sub">Approve or reject submitted marks and evaluations</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("addRemarks")}>
                <div className="action-icon-box blue">💬</div>
                <div className="action-text-box">
                  <div className="action-card-title">Add Remarks</div>
                  <div className="action-card-sub">Add mentor-specific remarks and feedback for teams</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("digitalSignature")}>
                <div className="action-icon-box dark">✍️</div>
                <div className="action-text-box">
                  <div className="action-card-title">Digital Signature</div>
                  <div className="action-card-sub">Sign and lock evaluations with your digital signature</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card" style={{ borderLeft: "4px solid #8b5cf6" }} onClick={() => setCurrentView("teamReports")}>
                <div className="action-icon-box" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>📄</div>
                <div className="action-text-box">
                  <div className="action-card-title">Team Reports</div>
                  <div className="action-card-sub">View summary reports for all assigned mentee teams</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TEAM WORKSPACE VIEW ================= */}
      {currentView === "teamWorkspace" && selectedTeam && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">🚀 {selectedTeam.team_name} — Mentor Evaluation Workspace</h1>
            <p className="full-page-desc">
              Project: <strong>{selectedTeam.project_title}</strong> • Guide: <strong>{selectedTeam.guide_name}</strong> • Code: <code>{selectedTeam.team_code}</code>
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }} className="no-print">
            <button
              className={`btn-secondary-pill ${workspaceTab === "actions" ? "active" : ""}`}
              style={{
                background: workspaceTab === "actions" ? "var(--airbnb-dark)" : "#ffffff",
                color: workspaceTab === "actions" ? "#ffffff" : "var(--airbnb-dark)",
                borderColor: "var(--airbnb-dark)",
                fontWeight: 800,
                padding: "10px 24px"
              }}
              onClick={() => setWorkspaceTab("actions")}
            >
              ⚡ Team Actions Hub
            </button>
            <button
              className={`btn-secondary-pill ${workspaceTab === "rubricDoc" ? "active" : ""}`}
              style={{
                background: workspaceTab === "rubricDoc" ? "var(--airbnb-dark)" : "#ffffff",
                color: workspaceTab === "rubricDoc" ? "#ffffff" : "var(--airbnb-dark)",
                borderColor: "var(--airbnb-dark)",
                fontWeight: 800,
                padding: "10px 24px"
              }}
              onClick={() => setWorkspaceTab("rubricDoc")}
            >
              📜 View Official 2-Page Rubric Report
            </button>
          </div>

          {workspaceTab === "actions" ? (
            <div>
              {/* 5 Actions Grid for Selected Team */}
              <div className="vertical-actions-grid" style={{ marginBottom: "28px" }}>
                <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("reviewMarks")}>
                  <div className="action-icon-box coral">📊</div>
                  <div className="action-text-box">
                    <div className="action-card-title">Review Marks</div>
                    <div className="action-card-sub">CO5: {selectedTeam.co5_marks}/20 • CO6: {selectedTeam.co6_marks}/20 • Total: {selectedTeam.total_marks}/40</div>
                  </div>
                  <div className="action-arrow">→</div>
                </div>

                <div className="vertical-action-card green-theme" onClick={() => setCurrentView("approveReject")}>
                  <div className="action-icon-box green">✅</div>
                  <div className="action-text-box">
                    <div className="action-card-title">Approve / Reject</div>
                    <div className="action-card-sub">Current Status: {selectedTeam.evaluation_status}</div>
                  </div>
                  <div className="action-arrow">→</div>
                </div>

                <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("addRemarks")}>
                  <div className="action-icon-box blue">💬</div>
                  <div className="action-text-box">
                    <div className="action-card-title">Add Remarks</div>
                    <div className="action-card-sub">{selectedTeam.mentor_remarks ? `Remarks: ${selectedTeam.mentor_remarks}` : "Add mentor feedback"}</div>
                  </div>
                  <div className="action-arrow">→</div>
                </div>

                <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("digitalSignature")}>
                  <div className="action-icon-box dark">✍️</div>
                  <div className="action-text-box">
                    <div className="action-card-title">Digital Signature</div>
                    <div className="action-card-sub">{selectedTeam.mentor_signature ? `Signed: ${selectedTeam.mentor_signature}` : "Sign & lock evaluation"}</div>
                  </div>
                  <div className="action-arrow">→</div>
                </div>

                <div className="vertical-action-card" style={{ borderLeft: "4px solid #8b5cf6" }} onClick={() => setWorkspaceTab("rubricDoc")}>
                  <div className="action-icon-box" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>📄</div>
                  <div className="action-text-box">
                    <div className="action-card-title">Team Reports</div>
                    <div className="action-card-sub">View full 2-page rubric document & print PDF</div>
                  </div>
                  <div className="action-arrow">→</div>
                </div>
              </div>

              {/* In-Line Evaluation Card for Quick Review */}
              <div className="airbnb-card">
                <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800 }}>⚡ Quick Actions for {selectedTeam.team_name}</h3>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 800, display: "block", marginBottom: "6px" }}>Mentor Feedback & Remarks:</label>
                    <textarea
                      rows={3}
                      defaultValue={selectedTeam.mentor_remarks}
                      placeholder="Enter mentor remarks..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      onBlur={(e) => handleSaveRemarks(selectedTeam.id, e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 800, display: "block", marginBottom: "6px" }}>Digital Signature:</label>
                    {selectedTeam.mentor_signature ? (
                      <div style={{ padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0", color: "#0f8a5f", fontSize: "13px", fontWeight: 700 }}>
                        ✍️ Signed by: {selectedTeam.mentor_signature}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          id={`sig-quick-${selectedTeam.id}`}
                          type="text"
                          placeholder={`e.g. ${displayName}`}
                          style={{ flex: 1, padding: "10px 12px", borderRadius: "8px", border: "1px solid #7c3aed", fontSize: "14px", fontWeight: 700 }}
                        />
                        <button
                          type="button"
                          className="btn-primary-pill"
                          style={{ padding: "10px 18px", fontSize: "12px", background: "#7c3aed", fontWeight: 800 }}
                          onClick={() => {
                            const input = document.getElementById(`sig-quick-${selectedTeam.id}`) as HTMLInputElement;
                            if (input?.value.trim()) handleSignature(selectedTeam.id, input.value.trim());
                          }}
                        >
                          Sign & Lock
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn-primary-pill"
                    style={{ padding: "10px 24px", fontSize: "13px", background: "#10b981", fontWeight: 800 }}
                    onClick={() => handleApprove(selectedTeam.id)}
                  >
                    ✅ Approve Evaluation
                  </button>
                  <button
                    type="button"
                    className="btn-primary-pill"
                    style={{ padding: "10px 24px", fontSize: "13px", background: "#ef4444", fontWeight: 800 }}
                    onClick={() => handleReject(selectedTeam.id)}
                  >
                    ❌ Reject Evaluation
                  </button>
                </div>
              </div>
            </div>
          ) : (
            renderOfficialRubricDocument(selectedTeam)
          )}
        </div>
      )}

      {/* ================= VIEW 1: REVIEW MARKS ================= */}
      {currentView === "reviewMarks" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">📊 Review Submitted Marks</h1>
            <p className="full-page-desc">Review marks submitted by faculty guides for your assigned mentee teams.</p>
          </div>

          <div className="airbnb-card">
            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Team Code</th>
                    <th>Team Name & Leader</th>
                    <th>Project Title</th>
                    <th>Guide</th>
                    <th>CO5 Marks</th>
                    <th>CO6 Marks</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr key={t.id}>
                      <td><code>{t.team_code}</code></td>
                      <td>
                        <strong style={{ color: "#1877f2" }}>{t.team_name}</strong>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>Leader: {t.leader_name}</span>
                      </td>
                      <td><strong>{t.project_title}</strong></td>
                      <td><span className="action-tag" style={{ background: "#f0f4ff", color: "#3b82f6" }}>{t.guide_name}</span></td>
                      <td style={{ fontWeight: 800, color: "#1d4ed8" }}>{t.co5_marks} / {Math.round(t.max_marks / 2)}</td>
                      <td style={{ fontWeight: 800, color: "#0f766e" }}>{t.co6_marks} / {Math.round(t.max_marks / 2)}</td>
                      <td style={{ fontWeight: 900, color: "#059669" }}>{t.total_marks} / {t.max_marks}</td>
                      <td>
                        <span className="legend-item" style={{
                          background: t.evaluation_status === "APPROVED" ? "#dcfce7" : t.evaluation_status === "REJECTED" ? "#fee2e2" : t.evaluation_status === "SUBMITTED" ? "#fef9c3" : "#f1f5f9",
                          color: t.evaluation_status === "APPROVED" ? "#0f8a5f" : t.evaluation_status === "REJECTED" ? "#dc2626" : t.evaluation_status === "SUBMITTED" ? "#a16207" : "#64748b",
                          fontWeight: 800,
                        }}>
                          {t.evaluation_status === "APPROVED" ? "✅ " : t.evaluation_status === "REJECTED" ? "❌ " : t.evaluation_status === "SUBMITTED" ? "⏳ " : "⚪ "}
                          {t.evaluation_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: APPROVE / REJECT ================= */}
      {currentView === "approveReject" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">✅ Approve / Reject Evaluations</h1>
            <p className="full-page-desc">Review and approve or reject marks submitted by faculty guides.</p>
          </div>

          {teams.map((t) => (
            <div key={t.id} className="airbnb-card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--airbnb-dark)" }}>{t.team_name}</h3>
                    <span className="legend-item" style={{
                      background: t.evaluation_status === "APPROVED" ? "#dcfce7" : t.evaluation_status === "REJECTED" ? "#fee2e2" : "#fef9c3",
                      color: t.evaluation_status === "APPROVED" ? "#0f8a5f" : t.evaluation_status === "REJECTED" ? "#dc2626" : "#a16207",
                      fontWeight: 800, fontSize: "12px",
                    }}>
                      {t.evaluation_status}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 4px", fontSize: "13px", color: "var(--airbnb-gray)" }}>
                    <strong>Project:</strong> {t.project_title} • <strong>Guide:</strong> {t.guide_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--airbnb-gray)" }}>
                    <strong>Leader:</strong> {t.leader_name} • <strong>Section:</strong> {t.section_name} • <code>{t.team_code}</code>
                  </p>

                  <div style={{ display: "flex", gap: "24px", marginTop: "12px", fontSize: "14px" }}>
                    <div><span style={{ fontWeight: 800, color: "#1d4ed8" }}>CO5: {t.co5_marks}/{Math.round(t.max_marks / 2)}</span></div>
                    <div><span style={{ fontWeight: 800, color: "#0f766e" }}>CO6: {t.co6_marks}/{Math.round(t.max_marks / 2)}</span></div>
                    <div><span style={{ fontWeight: 900, color: "#059669" }}>Total: {t.total_marks}/{t.max_marks}</span></div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {t.evaluation_status !== "APPROVED" && (
                    <button
                      type="button"
                      className="btn-primary-pill"
                      style={{ padding: "10px 24px", fontSize: "13px", background: "#10b981", fontWeight: 800 }}
                      onClick={() => handleApprove(t.id)}
                    >
                      ✅ Approve
                    </button>
                  )}
                  {t.evaluation_status !== "REJECTED" && (
                    <button
                      type="button"
                      className="btn-primary-pill"
                      style={{ padding: "10px 24px", fontSize: "13px", background: "#ef4444", fontWeight: 800 }}
                      onClick={() => handleReject(t.id)}
                    >
                      ❌ Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW 3: ADD REMARKS ================= */}
      {currentView === "addRemarks" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">💬 Add Mentor Remarks</h1>
            <p className="full-page-desc">Provide feedback and remarks for each team&apos;s evaluation.</p>
          </div>

          {teams.map((t) => (
            <div key={t.id} className="airbnb-card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--airbnb-dark)" }}>
                    {t.team_name} — {t.project_title}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                    Guide: {t.guide_name} • Leader: {t.leader_name} • <code>{t.team_code}</code>
                  </p>
                </div>
                <span style={{ fontWeight: 900, color: "#059669", fontSize: "16px" }}>{t.total_marks}/{t.max_marks}</span>
              </div>

              <textarea
                rows={3}
                defaultValue={t.mentor_remarks}
                placeholder={`Enter mentor remarks for ${t.team_name}...`}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", marginBottom: "12px", resize: "vertical" }}
                onBlur={(e) => handleSaveRemarks(t.id, e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-primary-pill"
                  style={{ padding: "8px 20px", fontSize: "12px", background: "#3b82f6", fontWeight: 800 }}
                  onClick={() => {
                    const textarea = document.querySelector(`textarea[placeholder="Enter mentor remarks for ${t.team_name}..."]`) as HTMLTextAreaElement;
                    if (textarea) handleSaveRemarks(t.id, textarea.value);
                  }}
                >
                  💾 Save Remarks
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW 4: DIGITAL SIGNATURE ================= */}
      {currentView === "digitalSignature" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">✍️ Digital Signature & Lock</h1>
            <p className="full-page-desc">Sign evaluations with your digital signature to finalize and lock them.</p>
          </div>

          {teams.map((t) => (
            <div key={t.id} className="airbnb-card" style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--airbnb-dark)" }}>
                    {t.team_name}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                    {t.project_title} • Total: <strong>{t.total_marks}/{t.max_marks}</strong>
                  </p>
                </div>
                <span className="legend-item" style={{
                  background: t.mentor_signature ? "#dcfce7" : "#fef9c3",
                  color: t.mentor_signature ? "#0f8a5f" : "#a16207",
                  fontWeight: 800, fontSize: "12px",
                }}>
                  {t.mentor_signature ? "✅ Signed" : "⏳ Awaiting Signature"}
                </span>
              </div>

              {t.mentor_signature ? (
                <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#0f8a5f" }}>
                    <strong>Signed by:</strong> {t.mentor_signature} • <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "13px", fontWeight: 800, display: "block", marginBottom: "4px" }}>Type your full name as digital signature:</label>
                    <input
                      id={`sig-${t.id}`}
                      type="text"
                      placeholder={`e.g. ${displayName}`}
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "2px solid #7c3aed", fontSize: "15px", fontWeight: 700, fontStyle: "italic" }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary-pill"
                    style={{ padding: "12px 28px", fontSize: "14px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontWeight: 800, whiteSpace: "nowrap" }}
                    onClick={() => {
                      const input = document.getElementById(`sig-${t.id}`) as HTMLInputElement;
                      if (input?.value.trim()) {
                        handleSignature(t.id, input.value.trim());
                      }
                    }}
                  >
                    ✍️ Sign & Lock
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ================= VIEW 5: TEAM REPORTS ================= */}
      {currentView === "teamReports" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <h1 className="full-page-title">📄 Team Reports & Official Documents</h1>
            <p className="full-page-desc">Complete summary reports & official 2-page printed rubric documents for all mentee teams.</p>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }} className="no-print">
            {teams.map((t) => (
              <button
                key={t.id}
                className={`btn-secondary-pill ${selectedTeamId === t.id ? "active" : ""}`}
                style={{
                  background: selectedTeamId === t.id ? "var(--airbnb-dark)" : "#ffffff",
                  color: selectedTeamId === t.id ? "#ffffff" : "var(--airbnb-dark)",
                  fontWeight: 800,
                  padding: "8px 20px"
                }}
                onClick={() => setSelectedTeamId(t.id)}
              >
                {t.team_name}
              </button>
            ))}
          </div>

          {renderOfficialRubricDocument(teams.find((t) => t.id === selectedTeamId) || teams[0])}
        </div>
      )}
    </div>
  );
}
