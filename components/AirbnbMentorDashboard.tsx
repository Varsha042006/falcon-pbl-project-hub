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

        <div id="official-pbl-rubric-print-area" className="rubric-print-area">
          {/* ===== PAGE 1: Rubrics Matrix & Regulations ===== */}
          <div className="airbnb-card rubric-page-card" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000" }}>
          {/* Institutional Header */}
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "16px", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
            <h1 style={{ margin: "4px 0 2px", fontSize: "26px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h1>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}>(Established under the Karnataka State Act No. 19 of 2023)</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px" }}>Post Box no-4, PB Road, Davangere-577006</p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>FACULTY OF ENGINEERING AND TECHNOLOGY</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: 800, color: "#c62828" }}>SCST B.Tech CSE</p>
          </div>

          {/* Assessment Title */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ textDecoration: "underline", fontSize: "18px", fontWeight: 900, margin: "0 0 10px" }}>
              PROJECT-BASED LEARNING (PBL) ASSESSMENT – Review 3
            </h2>
            <p style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", margin: 0 }}>
              RUBRIC FOR PROJECT-BASED LEARNING (PBL) ASSESSMENT WITH A TOTAL OF 20 MARKS, CATEGORIZED BASED ON BLOOM&apos;S TAXONOMY:
            </p>
          </div>

          {/* Metadata Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "13px", fontWeight: 700, marginBottom: "24px", padding: "12px 16px", border: "1px solid #000", background: "#ffffff" }}>
            <div><strong>Semester:</strong> {team.semester || "V"}</div>
            <div><strong>Sec:</strong> {team.section_name || "5A"}</div>
            <div><strong>Subcode:</strong> UE24CS2406</div>
            <div><strong>Project Name:</strong> {team.project_title}</div>
          </div>

          {/* 4-Criteria 20M Rubric Table */}
          <div style={{ overflowX: "auto", marginBottom: "28px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#ffffff", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000", padding: "10px 6px", width: "40px" }}>CO</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px", width: "150px" }}>Criteria</th>
                  <th style={{ border: "1px solid #000", padding: "10px 6px", width: "50px" }}>Marks</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 5</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 4</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 3</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 2</th>
                  <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 1</th>
                  <th style={{ border: "1px solid #000", padding: "10px 6px", width: "70px" }}>Obtained Marks</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO5</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>Testing &amp; Results</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>5</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Executes exceptional Testing &amp; Results (5M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Performs thorough Testing &amp; Results (4M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Conducts effective Testing &amp; Results (3M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Applies basic Testing &amp; Results (2M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Shows limited Testing &amp; Results (1M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: 800 }}>{Math.round(team.co5_marks / 2)} / 5</td>
                </tr>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO5</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>Results Interpretation &amp; Reporting</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>5</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Presents outstanding evaluation with comprehensive and clear reporting (5M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Provides detailed evaluation with clear reporting (4M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Demonstrates good evaluation with minor gaps (3M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Illustrates basic evaluation with limited reporting (2M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Displays weak analysis with inadequate reporting (1M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: 800 }}>{Math.round(team.co5_marks / 2)} / 5</td>
                </tr>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO6</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>System Demonstration &amp; Functionality</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>5</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Showcases excellent demonstration with flawless functionality (5M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Exhibits complete demonstration with seamless functionality (4M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Demonstrates effective functionality with minor issues (3M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Reveals partial demonstration with limited functionality (2M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Indicates incomplete demonstration with significant issues (1M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: 800 }}>{Math.round(team.co6_marks / 2)} / 5</td>
                </tr>
                <tr style={{ textAlign: "left", verticalAlign: "top" }}>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>CO6</td>
                  <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>Project Significance &amp; Future Scope</td>
                  <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>5</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Establishes exceptional impact assessment with innovative future scope (5M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Highlights strong impact assessment with clear future scope (4M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Explains good impact assessment with minor gaps (3M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Discusses basic impact assessment with limited future scope (2M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", fontSize: "11px" }}>Mentions minimal impact evaluation (1M)</td>
                  <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center", fontWeight: 800 }}>{Math.round(team.co6_marks / 2)} / 5</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: "12px", marginBottom: "24px", lineHeight: "1.6" }}>
            <strong>Note:</strong>
            <ol style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
              <li>Students who have not met the guides regularly will be awarded <strong>zero marks</strong>.</li>
              <li>Students who do not present their project progress according to the format or those who miss the presentation will be awarded <strong>zero marks</strong>.</li>
            </ol>
          </div>
        </div>

        {/* ===== PAGE 2: Student Marks Allocation & Declaration ===== */}
        <div className="airbnb-card rubric-page-card rubric-page-break" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000", marginTop: "32px", pageBreakBefore: "always", breakBefore: "page" as never }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "24px" }}>
            <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
            <h2 style={{ margin: "4px 0 2px", fontSize: "20px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 800, textTransform: "uppercase" }}>PBL ASSESSMENT – REVIEW 3 (PAGE 2: STUDENT MARKS &amp; DECLARATION)</p>
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
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>CO5 (10 Marks)</th>
                  <th style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800 }}>CO6 (10 Marks)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const usn = usnArray[idx]?.trim() || "";
                  const studentName = idx === 0 && usn ? `${team.leader_name} (Team Lead)` : (usn ? `Student Member #${idx + 1}` : "");
                  return (
                    <tr key={idx} style={{ textAlign: "center" }}>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", textAlign: "left", fontWeight: 700 }}>
                        {studentName || "Enter student name"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontFamily: "monospace", fontWeight: 700 }}>
                        {usn || "Enter USN"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800, color: "#1d4ed8" }}>
                        {usn ? `${Math.round(team.co5_marks / 2)}` : "0"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "10px 12px", fontWeight: 800, color: "#0f766e" }}>
                        {usn ? `${Math.round(team.co6_marks / 2)}` : "0"}
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
              Faculty Guide &amp; Mentor Assessment Feedback Remarks:
            </label>
            <div className="no-print" style={{ marginBottom: "10px" }}>
              <textarea
                rows={3}
                defaultValue={team.mentor_remarks}
                placeholder="Enter mentor remarks for this team evaluation..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #000", fontSize: "13px", fontFamily: "inherit" }}
                onBlur={(e) => handleSaveRemarks(team.id, e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
                <button
                  type="button"
                  className="btn-primary-pill"
                  style={{ padding: "6px 16px", fontSize: "12px", background: "#3b82f6", fontWeight: 800 }}
                  onClick={() => {
                    const el = document.querySelector(`textarea[placeholder="Enter mentor remarks for this team evaluation..."]`) as HTMLTextAreaElement;
                    if (el) handleSaveRemarks(team.id, el.value);
                  }}
                >
                  💾 Save Remarks
                </button>
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "8px", border: "1px solid #000", fontSize: "13px", background: "#fafafa" }}>
              {team.mentor_remarks || "No remarks entered."}
            </div>
          </div>

          <div style={{ borderTop: "2px solid #000", paddingTop: "18px", marginTop: "24px" }}>
            <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "20px" }}>
              I hereby declare that I have conducted the Review 3 presentation of the students, analyzed their progress, and evaluated their performance. The marks have been entered as per their performance in the review.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "360px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#000000", whiteSpace: "nowrap" }}>Guide Name:</strong>
                  <input
                    type="text"
                    placeholder="Enter guide name"
                    defaultValue={team.guide_name || ""}
                    style={{
                      flex: 1,
                      border: "none",
                      borderBottom: "1px dashed #64748b",
                      outline: "none",
                      background: "transparent",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#000000",
                      padding: "2px 4px"
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#000000", whiteSpace: "nowrap" }}>Designation:</strong>
                  <input
                    type="text"
                    placeholder="Enter designation"
                    defaultValue="Assistant Professor"
                    style={{
                      flex: 1,
                      border: "none",
                      borderBottom: "1px dashed #64748b",
                      outline: "none",
                      background: "transparent",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#000000",
                      padding: "2px 4px"
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#000000", whiteSpace: "nowrap" }}>Department:</strong>
                  <input
                    type="text"
                    placeholder="Enter department"
                    defaultValue="Computer Science & Engineering"
                    style={{
                      flex: 1,
                      border: "none",
                      borderBottom: "1px dashed #64748b",
                      outline: "none",
                      background: "transparent",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#000000",
                      padding: "2px 4px"
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "13px", color: "#000000", whiteSpace: "nowrap" }}>Date:</strong>
                  <input
                    type="text"
                    placeholder="dd/mm/yyyy"
                    defaultValue={new Date().toLocaleDateString("en-IN")}
                    style={{
                      flex: 1,
                      border: "none",
                      borderBottom: "1px dashed #64748b",
                      outline: "none",
                      background: "transparent",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#000000",
                      padding: "2px 4px"
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <strong style={{ fontSize: "13px", color: "#000000", whiteSpace: "nowrap" }}>Signature:</strong>
                  <span style={{ fontSize: "13px", color: "#000000", fontWeight: 700 }}>______________________</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "right" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Signature of Faculty Mentor:</strong>
                  {team.mentor_signature ? (
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f8a5f" }}>
                      ✍️ {team.mentor_signature} (Verified)
                    </span>
                  ) : (
                    <div>
                      <span style={{ color: "#dc2626", fontStyle: "italic", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                        Not signed yet.
                      </span>
                      <div className="no-print" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <input
                          id={`sig-rubric-${team.id}`}
                          type="text"
                          placeholder={`e.g. ${displayName}`}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #000", fontSize: "13px", fontWeight: 700, fontStyle: "italic", width: "160px" }}
                        />
                        <button
                          type="button"
                          className="btn-primary-pill"
                          style={{ padding: "6px 14px", fontSize: "12px", background: "linear-gradient(135deg, #7c3aed, #a855f7)", fontWeight: 800 }}
                          onClick={() => {
                            const input = document.getElementById(`sig-rubric-${team.id}`) as HTMLInputElement;
                            if (input?.value.trim()) handleSignature(team.id, input.value.trim());
                          }}
                        >
                          Sign &amp; Lock
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <strong style={{ fontSize: "13px", display: "block" }}>Signature of HOD</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>______________________</span>
                </div>

                <div>
                  <strong style={{ fontSize: "13px" }}>Evaluation Status:</strong>{" "}
                  <span className="legend-item" style={{
                    background: team.evaluation_status === "APPROVED" ? "#dcfce7" : team.evaluation_status === "REJECTED" ? "#fee2e2" : "#fef9c3",
                    color: team.evaluation_status === "APPROVED" ? "#0f8a5f" : team.evaluation_status === "REJECTED" ? "#dc2626" : "#a16207",
                    fontWeight: 800,
                  }}>
                    {team.evaluation_status}
                  </span>
                  <div className="no-print" style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="btn-primary-pill"
                      style={{ padding: "6px 14px", fontSize: "12px", background: "#10b981", fontWeight: 800 }}
                      onClick={() => handleApprove(team.id)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      type="button"
                      className="btn-primary-pill"
                      style={{ padding: "6px 14px", fontSize: "12px", background: "#ef4444", fontWeight: 800 }}
                      onClick={() => handleReject(team.id)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Total Final Score Assigned:</span>
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#059669", margin: "2px 0 0" }}>
                  {Math.round(team.total_marks / 2)} / 20 Marks
                </h2>
              </div>
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

          {renderOfficialRubricDocument(selectedTeam)}
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
