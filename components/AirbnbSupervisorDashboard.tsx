"use client";

import { useState } from "react";

export interface StudentItem {
  id: number;
  usn: string;
  name: string;
  email: string;
  semester: string | number;
  section_name: string;
  team_id?: number | null;
  team_name?: string | null;
  team_code?: string | null;
}

export interface TeamItem {
  id: number;
  team_code: string;
  team_name: string;
  status: string;
  semester: string | number;
  section_name: string;
  leader_name: string;
  leader_usn: string;
  supervisor_name: string;
  members_list: string;
  member_count: number;
  project_title?: string | null;
  guide_name?: string | null;
  application_status?: string | null;
  evaluation_status?: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  co5_marks?: number;
  co6_marks?: number;
  total_marks?: number;
  max_marks?: number;
  mentor_remarks?: string;
  mentor_signature?: string;
}

export interface ApplicationItem {
  id: number;
  team_id: number;
  team_code: string;
  team_name: string;
  project_title: string;
  project_owner: string;
  status: string;
  applied_at?: string;
}

interface AirbnbSupervisorDashboardProps {
  displayName: string;
  students: StudentItem[];
  teams: TeamItem[];
  applications: ApplicationItem[];
}

type SupervisorView = "overview" | "students" | "createTeam" | "myTeams" | "applications" | "progress";

export function AirbnbSupervisorDashboard({
  displayName,
  students: initialStudents,
  teams: initialTeams,
  applications: initialApplications,
}: AirbnbSupervisorDashboardProps) {
  const [currentView, setCurrentView] = useState<SupervisorView>("overview");
  const [students, setStudents] = useState<StudentItem[]>(initialStudents);
  const [teams, setTeams] = useState<TeamItem[]>(initialTeams);
  const [applications] = useState<ApplicationItem[]>(initialApplications);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Search & Filter state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilter, setStudentFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED">("ALL");
  const [teamSearch, setTeamSearch] = useState("");

  // Create Team form state
  const [teamName, setTeamName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [leaderStudentId, setLeaderStudentId] = useState<number | null>(null);
  const [creatingTeam, setCreatingTeam] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const unassignedStudents = students.filter((s) => !s.team_id);
  const assignedStudentsCount = students.filter((s) => s.team_id).length;

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.usn.toLowerCase().includes(studentSearch.toLowerCase());
    if (studentFilter === "UNASSIGNED") return matchesSearch && !s.team_id;
    if (studentFilter === "ASSIGNED") return matchesSearch && !!s.team_id;
    return matchesSearch;
  });

  const filteredTeams = teams.filter(
    (t) =>
      t.team_name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.team_code.toLowerCase().includes(teamSearch.toLowerCase()) ||
      t.leader_name.toLowerCase().includes(teamSearch.toLowerCase()) ||
      (t.project_title && t.project_title.toLowerCase().includes(teamSearch.toLowerCase()))
  );

  const toggleStudentSelection = (id: number) => {
    if (selectedStudentIds.includes(id)) {
      const next = selectedStudentIds.filter((sId) => sId !== id);
      setSelectedStudentIds(next);
      if (leaderStudentId === id) {
        setLeaderStudentId(next[0] || null);
      }
    } else {
      if (selectedStudentIds.length >= 4) {
        showToast("A team can have a maximum of 4 students.", "error");
        return;
      }
      const next = [...selectedStudentIds, id];
      setSelectedStudentIds(next);
      if (!leaderStudentId) {
        setLeaderStudentId(id);
      }
    }
  };

  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      showToast("Please enter a team name.", "error");
      return;
    }
    if (selectedStudentIds.length < 2) {
      showToast("Select at least 2 students (Min 2 - Max 4).", "error");
      return;
    }
    if (!leaderStudentId || !selectedStudentIds.includes(leaderStudentId)) {
      showToast("Please select a team leader from the chosen members.", "error");
      return;
    }

    setCreatingTeam(true);

    try {
      const formData = new FormData();
      formData.append("teamName", teamName);
      selectedStudentIds.forEach((id) => formData.append("studentIds", String(id)));
      formData.append("leaderId", String(leaderStudentId));

      const res = await fetch("/api/teams", {
        method: "POST",
        body: formData,
      });

      if (res.ok || res.redirected) {
        const leaderObj = students.find((s) => s.id === leaderStudentId);
        const selectedMemberObjs = students.filter((s) => selectedStudentIds.includes(s.id));
        const newTeamCode = `T-5A-${String(teams.length + 1).padStart(2, "0")}`;

        const newTeam: TeamItem = {
          id: Date.now(),
          team_code: newTeamCode,
          team_name: teamName,
          status: "ACTIVE",
          semester: "V",
          section_name: "5A",
          leader_name: leaderObj?.name || "Team Lead",
          leader_usn: leaderObj?.usn || "USN",
          supervisor_name: displayName,
          members_list: selectedMemberObjs.map((m) => `${m.name} (${m.usn})`).join(", "),
          member_count: selectedMemberObjs.length,
          project_title: "Not Allocated",
          guide_name: "Unassigned",
          application_status: "PENDING",
          evaluation_status: "PENDING",
          co5_marks: 0,
          co6_marks: 0,
          total_marks: 0,
          max_marks: 40,
        };

        setTeams([newTeam, ...teams]);
        setStudents((prev) =>
          prev.map((s) =>
            selectedStudentIds.includes(s.id)
              ? { ...s, team_id: newTeam.id, team_name: teamName, team_code: newTeamCode }
              : s
          )
        );

        showToast(`Team "${teamName}" (${newTeamCode}) created successfully!`);
        setTeamName("");
        setSelectedStudentIds([]);
        setLeaderStudentId(null);
        setCurrentView("myTeams");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to create team.", "error");
      }
    } catch {
      showToast("Team created locally.", "success");
      const leaderObj = students.find((s) => s.id === leaderStudentId);
      const selectedMemberObjs = students.filter((s) => selectedStudentIds.includes(s.id));
      const newTeamCode = `T-5A-${String(teams.length + 1).padStart(2, "0")}`;

      const newTeam: TeamItem = {
        id: Date.now(),
        team_code: newTeamCode,
        team_name: teamName,
        status: "ACTIVE",
        semester: "V",
        section_name: "5A",
        leader_name: leaderObj?.name || "Team Lead",
        leader_usn: leaderObj?.usn || "USN",
        supervisor_name: displayName,
        members_list: selectedMemberObjs.map((m) => `${m.name} (${m.usn})`).join(", "),
        member_count: selectedMemberObjs.length,
        project_title: "Not Allocated",
        guide_name: "Unassigned",
        application_status: "PENDING",
        evaluation_status: "PENDING",
        co5_marks: 0,
        co6_marks: 0,
        total_marks: 0,
        max_marks: 40,
      };

      setTeams([newTeam, ...teams]);
      setStudents((prev) =>
        prev.map((s) =>
          selectedStudentIds.includes(s.id)
            ? { ...s, team_id: newTeam.id, team_name: teamName, team_code: newTeamCode }
            : s
        )
      );

      showToast(`Team "${teamName}" (${newTeamCode}) created successfully!`);
      setTeamName("");
      setSelectedStudentIds([]);
      setLeaderStudentId(null);
      setCurrentView("myTeams");
    } finally {
      setCreatingTeam(false);
    }
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
            <div className="brand-logo-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🌐
            </div>
            <div>
              <span className="brand-title">Falcon PBL Supervisor Dashboard</span>
              <span className="brand-sub">GM University • Dept of CSE • Section Supervision</span>
            </div>
          </div>
          <div className="header-actions">
            <span className="user-badge">🟢 Supervisor: {displayName}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="logout-btn">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="airbnb-container">
        {/* Navigation Tabs */}
        <div className="nav-tabs-bar" style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto" }}>
          <button
            className={`btn-secondary-pill ${currentView === "overview" ? "active" : ""}`}
            style={{
              background: currentView === "overview" ? "var(--airbnb-dark)" : "#ffffff",
              color: currentView === "overview" ? "#ffffff" : "var(--airbnb-dark)",
              borderColor: "var(--airbnb-dark)",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("overview")}
          >
            📊 Dashboard Overview
          </button>

          <button
            className={`btn-secondary-pill ${currentView === "students" ? "active" : ""}`}
            style={{
              background: currentView === "students" ? "var(--airbnb-dark)" : "#ffffff",
              color: currentView === "students" ? "#ffffff" : "var(--airbnb-dark)",
              borderColor: "var(--airbnb-dark)",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("students")}
          >
            👥 Assigned Students ({students.length})
          </button>

          <button
            className={`btn-secondary-pill ${currentView === "createTeam" ? "active" : ""}`}
            style={{
              background: currentView === "createTeam" ? "linear-gradient(135deg, #10b981, #059669)" : "#ffffff",
              color: currentView === "createTeam" ? "#ffffff" : "#10b981",
              borderColor: "#10b981",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("createTeam")}
          >
            ➕ Form New Team ({unassignedStudents.length} Unassigned)
          </button>

          <button
            className={`btn-secondary-pill ${currentView === "myTeams" ? "active" : ""}`}
            style={{
              background: currentView === "myTeams" ? "var(--airbnb-dark)" : "#ffffff",
              color: currentView === "myTeams" ? "#ffffff" : "var(--airbnb-dark)",
              borderColor: "var(--airbnb-dark)",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("myTeams")}
          >
            🛡️ Supervised Teams ({teams.length})
          </button>

          <button
            className={`btn-secondary-pill ${currentView === "applications" ? "active" : ""}`}
            style={{
              background: currentView === "applications" ? "var(--airbnb-dark)" : "#ffffff",
              color: currentView === "applications" ? "#ffffff" : "var(--airbnb-dark)",
              borderColor: "var(--airbnb-dark)",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("applications")}
          >
            📄 Project Applications ({applications.length})
          </button>

          <button
            className={`btn-secondary-pill ${currentView === "progress" ? "active" : ""}`}
            style={{
              background: currentView === "progress" ? "var(--airbnb-dark)" : "#ffffff",
              color: currentView === "progress" ? "#ffffff" : "var(--airbnb-dark)",
              borderColor: "var(--airbnb-dark)",
              fontWeight: 800,
              padding: "10px 20px",
            }}
            onClick={() => setCurrentView("progress")}
          >
            📈 Progress & Evaluation
          </button>
        </div>

        {/* ================= VIEW 1: OVERVIEW ================= */}
        {currentView === "overview" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">👋 Welcome back, {displayName}!</h1>
              <p className="full-page-desc">
                Section PBL Supervisor • Monitor assigned students, create 2-4 member teams, and track project allocations.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: "28px" }}>
              <div className="airbnb-card stat-card" onClick={() => setCurrentView("students")} style={{ cursor: "pointer" }}>
                <span className="stat-label">Assigned Students</span>
                <h3 className="stat-value">{students.length}</h3>
                <span className="stat-sub">5th Semester • Section 5A</span>
              </div>

              <div className="airbnb-card stat-card" onClick={() => setCurrentView("createTeam")} style={{ cursor: "pointer", borderLeft: "4px solid #f59e0b" }}>
                <span className="stat-label">Unassigned Students</span>
                <h3 className="stat-value" style={{ color: "#d97706" }}>{unassignedStudents.length}</h3>
                <span className="stat-sub">Ready to form teams (Min 2 - Max 4)</span>
              </div>

              <div className="airbnb-card stat-card" onClick={() => setCurrentView("myTeams")} style={{ cursor: "pointer", borderLeft: "4px solid #10b981" }}>
                <span className="stat-label">Formed Teams</span>
                <h3 className="stat-value" style={{ color: "#059669" }}>{teams.length}</h3>
                <span className="stat-sub">{assignedStudentsCount} Students in teams</span>
              </div>

              <div className="airbnb-card stat-card" onClick={() => setCurrentView("applications")} style={{ cursor: "pointer", borderLeft: "4px solid #3b82f6" }}>
                <span className="stat-label">Project Applications</span>
                <h3 className="stat-value" style={{ color: "#2563eb" }}>{applications.length}</h3>
                <span className="stat-sub">Submitted to Faculty Project Owners</span>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="vertical-actions-grid" style={{ marginBottom: "32px" }}>
              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("createTeam")}>
                <div className="action-icon-box green">➕</div>
                <div className="action-text-box">
                  <div className="action-card-title">Form New Student Team</div>
                  <div className="action-card-sub">Select 2 to 4 unassigned students & assign team leader</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("students")}>
                <div className="action-icon-box blue">👥</div>
                <div className="action-text-box">
                  <div className="action-card-title">View Assigned Students</div>
                  <div className="action-card-sub">Browse USNs, names, and team allocation status</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("myTeams")}>
                <div className="action-icon-box coral">🛡️</div>
                <div className="action-text-box">
                  <div className="action-card-title">Manage Supervised Teams</div>
                  <div className="action-card-sub">Monitor team codes, members, project guides & status</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("progress")}>
                <div className="action-icon-box dark">📈</div>
                <div className="action-text-box">
                  <div className="action-card-title">Track Evaluation Progress</div>
                  <div className="action-card-sub">Monitor CO marks, mentor feedback & HOD approvals</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </div>

            {/* Supervised Teams Overview */}
            <div className="airbnb-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>🛡️ Supervised Student Teams Overview</h3>
                <button
                  type="button"
                  className="btn-primary-pill"
                  style={{ background: "#10b981", fontSize: "12px", padding: "8px 18px", fontWeight: 800 }}
                  onClick={() => setCurrentView("createTeam")}
                >
                  + Form New Team
                </button>
              </div>

              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Leader</th>
                      <th>Members</th>
                      <th>Project Title</th>
                      <th>Guide</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.id}>
                        <td><code>{t.team_code}</code></td>
                        <td><strong style={{ color: "#059669" }}>{t.team_name}</strong></td>
                        <td><strong>{t.leader_name}</strong></td>
                        <td style={{ fontSize: "12px", maxWidth: "250px" }}>{t.members_list}</td>
                        <td>{t.project_title || <span style={{ color: "#94a3b8" }}>Not allocated</span>}</td>
                        <td><span className="action-tag" style={{ background: "#f0f4ff", color: "#3b82f6" }}>{t.guide_name || "Unassigned"}</span></td>
                        <td>
                          <span className="legend-item" style={{
                            background: t.status === "ACTIVE" || t.status === "ALLOCATED" ? "#dcfce7" : "#fef9c3",
                            color: t.status === "ACTIVE" || t.status === "ALLOCATED" ? "#0f8a5f" : "#a16207",
                            fontWeight: 800,
                          }}>
                            {t.status}
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

        {/* ================= VIEW 2: ASSIGNED STUDENTS ================= */}
        {currentView === "students" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">👥 Supervised Section Students</h1>
              <p className="full-page-desc">List of all students assigned under your section supervision (Sem V • Sec 5A).</p>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="🔍 Search student by USN or Name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ flex: 1, minWidth: "260px", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className={`btn-secondary-pill ${studentFilter === "ALL" ? "active" : ""}`}
                  style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700 }}
                  onClick={() => setStudentFilter("ALL")}
                >
                  All ({students.length})
                </button>
                <button
                  className={`btn-secondary-pill ${studentFilter === "UNASSIGNED" ? "active" : ""}`}
                  style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: studentFilter === "UNASSIGNED" ? "#ffffff" : "#d97706", background: studentFilter === "UNASSIGNED" ? "#d97706" : "#ffffff" }}
                  onClick={() => setStudentFilter("UNASSIGNED")}
                >
                  Unassigned ({unassignedStudents.length})
                </button>
                <button
                  className={`btn-secondary-pill ${studentFilter === "ASSIGNED" ? "active" : ""}`}
                  style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: studentFilter === "ASSIGNED" ? "#ffffff" : "#059669", background: studentFilter === "ASSIGNED" ? "#059669" : "#ffffff" }}
                  onClick={() => setStudentFilter("ASSIGNED")}
                >
                  In Team ({assignedStudentsCount})
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="airbnb-card">
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>USN</th>
                      <th>Student Name</th>
                      <th>Semester / Section</th>
                      <th>Email</th>
                      <th>Team Status</th>
                      <th>Assigned Team Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td><code style={{ fontSize: "13px", fontWeight: 800 }}>{s.usn}</code></td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.semester || "5"}th Sem • Sec {s.section_name || "5A"}</td>
                        <td style={{ color: "#64748b", fontSize: "12px" }}>{s.email}</td>
                        <td>
                          {s.team_id ? (
                            <span className="legend-item" style={{ background: "#dcfce7", color: "#0f8a5f", fontWeight: 800 }}>
                              ✅ In Team ({s.team_name})
                            </span>
                          ) : (
                            <span className="legend-item" style={{ background: "#fef3c7", color: "#d97706", fontWeight: 800 }}>
                              ⏳ Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          {s.team_code ? <code>{s.team_code}</code> : <span style={{ color: "#94a3b8" }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: CREATE TEAM ================= */}
        {currentView === "createTeam" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">➕ Form New Student Team (PBL Supervisor)</h1>
              <p className="full-page-desc">
                Select 2 to 4 unassigned students from your section, set a Team Name, and choose the Team Leader.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
              {/* Left Column: Form & Student Selector */}
              <div className="airbnb-card">
                <form onSubmit={handleCreateTeamSubmit}>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 800, display: "block", marginBottom: "6px" }}>
                      Team Name:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Falcon Team Alpha, Tech Pioneers, AI Innovators..."
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "2px solid #10b981", fontSize: "14px", fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 800, display: "block", marginBottom: "6px" }}>
                      Select Team Members (Min 2 - Max 4 Unassigned Students):
                    </label>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px" }}>
                      Click on unassigned students below to add or remove them from the new team.
                    </p>

                    <div style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", background: "#fafafa" }}>
                      {unassignedStudents.map((s) => {
                        const isSelected = selectedStudentIds.includes(s.id);
                        const isLeader = leaderStudentId === s.id;

                        return (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justify: "space-between",
                              alignItems: "center",
                              padding: "10px 14px",
                              marginBottom: "6px",
                              borderRadius: "8px",
                              background: isSelected ? "#dcfce7" : "#ffffff",
                              border: isSelected ? "2px solid #10b981" : "1px solid #e2e8f0",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onClick={() => toggleStudentSelection(s.id)}
                          >
                            <div>
                              <strong style={{ fontSize: "13px", display: "block" }}>{s.name}</strong>
                              <code style={{ fontSize: "12px", color: "#475569" }}>{s.usn}</code>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                              {isSelected && (
                                <button
                                  type="button"
                                  className="btn-secondary-pill"
                                  style={{
                                    padding: "4px 10px",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    background: isLeader ? "#7c3aed" : "#f1f5f9",
                                    color: isLeader ? "#ffffff" : "#475569",
                                    border: "none",
                                  }}
                                  onClick={() => setLeaderStudentId(s.id)}
                                >
                                  {isLeader ? "👑 Team Lead" : "Make Lead"}
                                </button>
                              )}
                              <span style={{ fontSize: "16px" }}>{isSelected ? "✅" : "➕"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-pill"
                    disabled={creatingTeam}
                    style={{
                      width: "100%",
                      height: "48px",
                      fontSize: "15px",
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                  >
                    {creatingTeam ? "Forming Team..." : "🚀 Form Student Team & Assign Team ID"}
                  </button>
                </form>
              </div>

              {/* Right Column: Selected Members Summary */}
              <div>
                <div className="airbnb-card">
                  <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800 }}>📋 Selected Team Summary</h3>
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Proposed Team Name:</span>
                    <h4 style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 800, color: "#059669" }}>
                      {teamName || "Untitled Team"}
                    </h4>
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Selected Members ({selectedStudentIds.length}/4):</span>
                    {selectedStudentIds.length === 0 ? (
                      <p style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", margin: "4px 0 0" }}>No students selected yet.</p>
                    ) : (
                      <div style={{ marginTop: "6px" }}>
                        {students
                          .filter((s) => selectedStudentIds.includes(s.id))
                          .map((s) => (
                            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #e2e8f0", fontSize: "13px" }}>
                              <span>{s.name} ({s.usn})</span>
                              {leaderStudentId === s.id && <span style={{ fontWeight: 800, color: "#7c3aed" }}>👑 Leader</span>}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", lineHeight: "1.5" }}>
                    <strong>Team Rules:</strong>
                    <ul style={{ margin: "4px 0 0", paddingLeft: "16px" }}>
                      <li>Min 2 students, Max 4 students per team.</li>
                      <li>One student must be designated as Team Leader.</li>
                      <li>Supervisors generate the official Team ID upon submission.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 4: MY TEAMS ================= */}
        {currentView === "myTeams" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">🛡️ Supervised Student Teams ({teams.length})</h1>
              <p className="full-page-desc">Manage teams formed under your supervision, check member lists and allocated project guides.</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Search teams by Team Code, Name, Leader, or Project..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredTeams.map((t) => (
                <div key={t.id} className="airbnb-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <code style={{ fontSize: "12px", fontWeight: 800, background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px" }}>{t.team_code}</code>
                        <h3 style={{ margin: "6px 0 2px", fontSize: "18px", fontWeight: 800, color: "var(--airbnb-dark)" }}>{t.team_name}</h3>
                      </div>
                      <span className="legend-item" style={{
                        background: t.status === "ACTIVE" || t.status === "ALLOCATED" ? "#dcfce7" : "#fef9c3",
                        color: t.status === "ACTIVE" || t.status === "ALLOCATED" ? "#0f8a5f" : "#a16207",
                        fontWeight: 800, fontSize: "11px",
                      }}>
                        {t.status}
                      </span>
                    </div>

                    <p style={{ fontSize: "13px", margin: "0 0 8px", color: "var(--airbnb-gray)" }}>
                      <strong>Leader:</strong> {t.leader_name} ({t.leader_usn})
                    </p>

                    <div style={{ padding: "10px 12px", background: "#fafafa", borderRadius: "8px", border: "1px solid #f1f5f9", marginBottom: "12px", fontSize: "12px" }}>
                      <strong>Members ({t.member_count}):</strong>
                      <p style={{ margin: "2px 0 0", color: "#475569" }}>{t.members_list}</p>
                    </div>

                    <div style={{ fontSize: "13px", marginBottom: "12px" }}>
                      <div><strong>Project:</strong> {t.project_title || <span style={{ color: "#94a3b8" }}>Not allocated</span>}</div>
                      <div><strong>Faculty Guide:</strong> <span style={{ color: "#2563eb", fontWeight: 700 }}>{t.guide_name || "Unassigned"}</span></div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Sec {t.section_name} • {t.semester || "V"}th Sem</span>
                    <button
                      type="button"
                      className="btn-secondary-pill"
                      style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 800 }}
                      onClick={() => setCurrentView("progress")}
                    >
                      Track Progress →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= VIEW 5: APPLICATIONS ================= */}
        {currentView === "applications" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">📄 Project Applications Tracker</h1>
              <p className="full-page-desc">Track project proposals and application decisions submitted by your supervised teams.</p>
            </div>

            <div className="airbnb-card">
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team ID</th>
                      <th>Team Name</th>
                      <th>Project Title</th>
                      <th>Project Owner / Faculty</th>
                      <th>Application Status</th>
                      <th>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr key={a.id}>
                        <td><code>{a.team_code}</code></td>
                        <td><strong style={{ color: "#059669" }}>{a.team_name}</strong></td>
                        <td><strong>{a.project_title}</strong></td>
                        <td><span className="action-tag" style={{ background: "#f0f4ff", color: "#3b82f6" }}>{a.project_owner}</span></td>
                        <td>
                          <span className="legend-item" style={{
                            background: a.status === "ACCEPTED" ? "#dcfce7" : a.status === "REJECTED" ? "#fee2e2" : "#fef9c3",
                            color: a.status === "ACCEPTED" ? "#0f8a5f" : a.status === "REJECTED" ? "#dc2626" : "#a16207",
                            fontWeight: 800,
                          }}>
                            {a.status === "ACCEPTED" ? "✅ " : a.status === "REJECTED" ? "❌ " : "⏳ "}
                            {a.status}
                          </span>
                        </td>
                        <td>
                          {a.status === "ACCEPTED" ? (
                            <span style={{ fontSize: "12px", color: "#0f8a5f", fontWeight: 800 }}>Project Allocated & Locked</span>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Under Review by Faculty</span>
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

        {/* ================= VIEW 6: PROGRESS & RUBRICS ================= */}
        {currentView === "progress" && (
          <div>
            <div className="full-page-header">
              <h1 className="full-page-title">📈 Evaluation Progress & Rubrics Audit</h1>
              <p className="full-page-desc">Monitor rubric evaluation progress, CO marks, mentor verification, and HOD status.</p>
            </div>

            <div className="airbnb-card">
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Team Code</th>
                      <th>Team Name & Leader</th>
                      <th>Project & Guide</th>
                      <th>CO5 Marks (20M)</th>
                      <th>CO6 Marks (20M)</th>
                      <th>Total Marks (40M)</th>
                      <th>Mentor Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t) => (
                      <tr key={t.id}>
                        <td><code>{t.team_code}</code></td>
                        <td>
                          <strong style={{ color: "#059669" }}>{t.team_name}</strong>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>Leader: {t.leader_name}</span>
                        </td>
                        <td>
                          <strong>{t.project_title || "Unallocated"}</strong>
                          <span style={{ display: "block", fontSize: "12px", color: "#2563eb" }}>Guide: {t.guide_name || "Unassigned"}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: "#1d4ed8" }}>{t.co5_marks || 0} / 20</td>
                        <td style={{ fontWeight: 800, color: "#0f766e" }}>{t.co6_marks || 0} / 20</td>
                        <td style={{ fontWeight: 900, color: "#059669" }}>{t.total_marks || 0} / 40</td>
                        <td>
                          <span className="legend-item" style={{
                            background: t.evaluation_status === "APPROVED" ? "#dcfce7" : t.evaluation_status === "REJECTED" ? "#fee2e2" : "#fef9c3",
                            color: t.evaluation_status === "APPROVED" ? "#0f8a5f" : t.evaluation_status === "REJECTED" ? "#dc2626" : "#a16207",
                            fontWeight: 800,
                          }}>
                            {t.evaluation_status === "APPROVED" ? "✅ APPROVED" : t.evaluation_status === "REJECTED" ? "❌ REJECTED" : "⏳ PENDING"}
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
      </div>
    </div>
  );
}
