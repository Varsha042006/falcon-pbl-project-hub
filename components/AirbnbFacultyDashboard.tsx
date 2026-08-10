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

interface AirbnbFacultyDashboardProps {
  displayName: string;
  myProjects: ProjectItem[];
  menteeTeams: MenteeTeamItem[];
  applications: ApplicationItem[];
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
}: AirbnbFacultyDashboardProps) {
  const [currentView, setCurrentView] = useState<FacultyPageView>("home");
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [menteeTeams] = useState<MenteeTeamItem[]>(initialTeams);
  const [applications, setApplications] = useState<ApplicationItem[]>(initialApplications);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Selected Semester for Allotted Teams view
  const [selectedAllottedSem, setSelectedAllottedSem] = useState<number>(5);

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

  // Evaluation Form State
  const [selectedTeamId, setSelectedTeamId] = useState<number>(menteeTeams[0]?.id || 1);
  const [co5Marks, setCo5Marks] = useState(9);
  const [co6Marks, setCo6Marks] = useState(9);
  const [evalRemarks, setEvalRemarks] = useState("Excellent progress and flawless demonstration.");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
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

  // Submit Evaluation Marks
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = menteeTeams.find((t) => t.id === Number(selectedTeamId));
    showToast(`Submitted Review 3 evaluation marks for Team ${team?.team_name || "Falcon CS-A1"}!`);

    try {
      await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_EVALUATION",
          data: {
            team_id: selectedTeamId,
            co5_marks: co5Marks,
            co6_marks: co6Marks,
            remarks: evalRemarks,
          },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Filter allotted teams by selected semester
  const filteredAllottedTeams = menteeTeams.filter((t) => {
    if (!t.semester) return selectedAllottedSem === 5;
    return Number(t.semester) === Number(selectedAllottedSem);
  });

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
            {currentView !== "home" && (
              <button
                className="action-pill-btn"
                style={{ background: "#f0f2f5", color: "#1c1e21", border: "1px solid #dbdbdb" }}
                onClick={() => setCurrentView("home")}
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

      {/* ================= VIEW 1: FACULTY DASHBOARD HOME ================= */}
      {currentView === "home" && (
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

              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("allottedTeams")}>
                <div className="action-icon-box green">🏆</div>
                <div className="action-text-box">
                  <div className="action-card-title">Allotted Teams by Semester</div>
                  <div className="action-card-sub">Select semester (1st - 8th Sem) to view dedicated allotted teams page</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("menteeTeams")}>
                <div className="action-icon-box green">👥</div>
                <div className="action-text-box">
                  <div className="action-card-title">Assigned Mentee Student Teams</div>
                  <div className="action-card-sub">View student team rosters, USNs, and assigned project titles</div>
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
                  <div className="action-card-sub">Grade student teams for Review 3 (CO5 & CO6 - 20 Marks Total)</div>
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
                  Select a semester below to open its dedicated page and view all mentee teams assigned under your supervision.
                </p>
              </div>

              <button
                type="button"
                className="btn-secondary-pill"
                style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 800 }}
                onClick={() => setCurrentView("allottedTeams")}
              >
                Explore All Semesters →
              </button>
            </div>

            {/* Semester Quick Selector Buttons Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const countForSem = menteeTeams.filter((t) => (t.semester || 5) === sem).length;

                return (
                  <button
                    key={sem}
                    type="button"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "14px",
                      padding: "16px 12px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => {
                      setSelectedAllottedSem(sem);
                      setCurrentView("allottedTeams");
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--airbnb-dark)", marginBottom: "4px" }}>
                      Semester {sem}
                    </div>
                    <div style={{ fontSize: "12px", color: countForSem > 0 ? "#0f8a5f" : "var(--airbnb-gray)", fontWeight: 700 }}>
                      {countForSem > 0 ? `🟢 ${countForSem} Teams` : "⚪ 0 Teams"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: MY PUBLISHED PROJECTS ================= */}
      {currentView === "myProjects" && (
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
      {currentView === "allottedTeams" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">🏆 Allotted Student Teams by Semester</h1>
            <p className="full-page-desc">Select a semester below to open its dedicated allotted teams page and view all mentee teams assigned under your supervision.</p>
          </div>

          {/* Semester Selector Buttons Bar */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "28px" }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
              const isSelected = Number(selectedAllottedSem) === sem;
              const countForSem = menteeTeams.filter((t) => (t.semester || 5) === sem).length;

              return (
                <button
                  key={sem}
                  type="button"
                  className={`btn-secondary-pill ${isSelected ? "active" : ""}`}
                  style={{
                    background: isSelected ? "var(--airbnb-dark)" : "#ffffff",
                    color: isSelected ? "#ffffff" : "var(--airbnb-dark)",
                    borderColor: "var(--airbnb-dark)",
                    fontWeight: 800,
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "30px",
                  }}
                  onClick={() => setSelectedAllottedSem(sem)}
                >
                  <span>Semester {sem}</span>
                  <span
                    style={{
                      background: isSelected ? "#ffffff" : "var(--airbnb-dark)",
                      color: isSelected ? "var(--airbnb-dark)" : "#ffffff",
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                    }}
                  >
                    {countForSem}
                  </span>
                </button>
              );
            })}
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllottedTeams.map((t) => (
                      <tr key={t.id}>
                        <td><code>{t.team_code}</code></td>
                        <td>
                          <strong>{t.team_name}</strong>
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
                  Select another semester above or check back when the coordinator finalizes team allocations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 4: MENTEE STUDENT TEAMS ================= */}
      {currentView === "menteeTeams" && (
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
                  </tr>
                </thead>
                <tbody>
                  {menteeTeams.map((t) => (
                    <tr key={t.id}>
                      <td><code>{t.team_code}</code></td>
                      <td>
                        <strong>{t.team_name}</strong>
                        <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>Leader: {t.leader_name}</span>
                      </td>
                      <td><code>{t.usn_list}</code></td>
                      <td><span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>Section {t.section_name}</span></td>
                      <td><strong>{t.project_title}</strong></td>
                      <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>{t.status} 🟢</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 5: APPLICATIONS REVIEW ================= */}
      {currentView === "applications" && (
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

      {/* ================= VIEW 6: EVALUATION & MARK SUBMISSION ================= */}
      {currentView === "evaluations" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📊 Review 3 Rubric Evaluation & Mark Submission</h1>
            <p className="full-page-desc">Grade mentee student teams using the official GM University Review 3 Rubric format (20 Marks Total).</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "24px" }}>
            {/* Left: Evaluation Form */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>Review 3 Evaluation Form</h2>
              <form onSubmit={handleSubmitEvaluation}>
                <div className="modal-field">
                  <label>Select Mentee Team to Grade</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                  >
                    {menteeTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.team_code} - {t.team_name} (Section {t.section_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 12px", color: "var(--airbnb-dark)" }}>
                    Evaluation Rubric Criteria (Official GM University Review 3)
                  </h3>

                  <div className="modal-field">
                    <label>CO5: Testing & Results Interpretation (Max 10 Marks)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={co5Marks}
                      onChange={(e) => setCo5Marks(Number(e.target.value))}
                      required
                    />
                    <span style={{ fontSize: "12px", color: "var(--airbnb-gray)" }}>Testing & Validation (5M) + Results & Reporting (5M)</span>
                  </div>

                  <div className="modal-field" style={{ marginBottom: 0 }}>
                    <label>CO6: System Demonstration & Future Scope (Max 10 Marks)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={co6Marks}
                      onChange={(e) => setCo6Marks(Number(e.target.value))}
                      required
                    />
                    <span style={{ fontSize: "12px", color: "var(--airbnb-gray)" }}>Demonstration & Functionality (5M) + Future Scope (5M)</span>
                  </div>
                </div>

                <div className="modal-field">
                  <label>Faculty Guide Remarks & Feedback</label>
                  <textarea
                    rows={3}
                    value={evalRemarks}
                    onChange={(e) => setEvalRemarks(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #dbdbdb" }}
                  />
                </div>

                <button type="submit" className="btn-primary-pill" style={{ width: "100%", height: "48px" }}>
                  💾 Submit Review 3 Evaluation Marks
                </button>
              </form>
            </div>

            {/* Right: Summary Card */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>Grading Summary</h2>
              <div style={{ background: "#e7f7ef", padding: "20px", borderRadius: "14px", border: "1px solid #a7f3d0", marginBottom: "20px" }}>
                <span style={{ fontSize: "13px", color: "#0f8a5f", fontWeight: 700 }}>Total Calculated Score</span>
                <h2 style={{ fontSize: "36px", fontWeight: 900, color: "#0f8a5f", margin: "4px 0" }}>
                  {co5Marks + co6Marks} / 20 Marks
                </h2>
                <span style={{ fontSize: "12px", color: "#0f8a5f" }}>CO5 ({co5Marks}/10) + CO6 ({co6Marks}/10)</span>
              </div>

              <div style={{ fontSize: "13px", lineHeight: "1.6", color: "var(--airbnb-dark)" }}>
                <p><strong>Assessment:</strong> Review 3 Final Evaluation</p>
                <p><strong>Institution:</strong> GM University • CSE Dept</p>
                <p><strong>Guide:</strong> {displayName}</p>
                <p><strong>Evaluation Status:</strong> Ready to Submit 🟢</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
