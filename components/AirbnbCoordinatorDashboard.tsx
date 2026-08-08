"use client";

import { useState } from "react";

export interface SupervisorAssignment {
  id: number;
  faculty_id?: number;
  faculty_name: string;
  section_name: string;
  program_code: string;
}

export interface FacultyItem {
  id: number;
  faculty_code: string;
  name: string;
  email: string;
  designation: string | null;
  department: string | null;
}

export interface SectionItem {
  id: number;
  name: string;
  program_code?: string;
}

export interface RubricCriteria {
  id?: number;
  name: string;
  weightage: number;
  max_marks: number;
}

export interface RubricItem {
  id: number;
  name: string;
  description: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity_name: string;
  created_at: string;
}

interface AirbnbCoordinatorDashboardProps {
  displayName: string;
  supervisorAssignments: SupervisorAssignment[];
  allFaculty: FacultyItem[];
  allSections: SectionItem[];
  rubrics: RubricItem[];
  criteriaList: RubricCriteria[];
  totalTeams: number;
  allocatedTeams: number;
  totalProjects: number;
  auditLogs: AuditLogItem[];
}

type CoordinatorPageView =
  | "home"
  | "supervisorMapping"
  | "rubricsCreator"
  | "allocations"
  | "auditLogs";

export function AirbnbCoordinatorDashboard({
  displayName,
  supervisorAssignments: initialAssignments,
  allFaculty,
  allSections,
  rubrics,
  criteriaList: initialCriteria,
  totalTeams,
  allocatedTeams,
  totalProjects,
  auditLogs,
}: AirbnbCoordinatorDashboardProps) {
  const [currentView, setCurrentView] = useState<CoordinatorPageView>("home");
  const [assignments, setAssignments] = useState<SupervisorAssignment[]>(initialAssignments);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  // Search filters
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  // Assign Supervisor Form State
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(allFaculty[0]?.id || 1);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(allSections[0]?.id || 1);
  const [isPrimary, setIsPrimary] = useState(true);

  // Per-row section selection state
  const [rowSelections, setRowSelections] = useState<Record<number, number>>({});

  // Criteria form state
  const [criteria, setCriteria] = useState<RubricCriteria[]>(initialCriteria);
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaWeightage, setNewCriteriaWeightage] = useState(10);
  const [newCriteriaMaxMarks, setNewCriteriaMaxMarks] = useState(10);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handler: Assign Faculty as Supervisor
  const handleAssignSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacultyId || !selectedSectionId) return;

    const fac = allFaculty.find((f) => f.id === Number(selectedFacultyId));
    const sec = allSections.find((s) => s.id === Number(selectedSectionId));
    if (!fac || !sec) return;

    setLoading(true);

    const newAssignment: SupervisorAssignment = {
      id: Date.now(),
      faculty_id: fac.id,
      faculty_name: fac.name,
      section_name: sec.name,
      program_code: "CSE",
    };

    // Optimistic UI Update
    setAssignments((prev) => [newAssignment, ...prev.filter((a) => a.faculty_name !== fac.name)]);
    showToast(`Assigned ${fac.name} to Section ${sec.name}!`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_SUPERVISOR",
          data: {
            faculty_id: selectedFacultyId,
            section_id: selectedSectionId,
            is_primary: isPrimary,
          },
        }),
      });
    } catch {
      showToast("Assigned supervisor locally", "success");
    }

    setLoading(false);
  };

  // Inline Quick Assign Handler for Faculty Table
  const handleQuickAssign = async (facId: number, secId: number) => {
    const fac = allFaculty.find((f) => f.id === facId);
    const sec = allSections.find((s) => s.id === secId);
    if (!fac || !sec) return;

    const newAssignment: SupervisorAssignment = {
      id: Date.now(),
      faculty_id: fac.id,
      faculty_name: fac.name,
      section_name: sec.name,
      program_code: "CSE",
    };

    setAssignments((prev) => [newAssignment, ...prev.filter((a) => a.faculty_name !== fac.name)]);
    showToast(`Assigned ${fac.name} to Section ${sec.name}!`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_SUPERVISOR",
          data: { faculty_id: facId, section_id: secId, is_primary: true },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  const handleAddCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaName) return;
    const newItem: RubricCriteria = {
      name: newCriteriaName,
      weightage: newCriteriaWeightage,
      max_marks: newCriteriaMaxMarks,
    };
    setCriteria([...criteria, newItem]);
    setNewCriteriaName("");
    showToast(`Added criteria "${newCriteriaName}" to evaluation rubric!`);
  };

  const filteredSupervisors = assignments.filter(
    (sa) =>
      sa.faculty_name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      sa.section_name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      sa.program_code.toLowerCase().includes(supervisorSearch.toLowerCase())
  );

  const filteredFacultyList = allFaculty.filter(
    (f) =>
      f.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      f.faculty_code.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      (f.department && f.department.toLowerCase().includes(supervisorSearch.toLowerCase()))
  );

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.entity_name.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.id.toString().includes(logSearch)
  );

  const totalWeightage = criteria.reduce((acc, c) => acc + Number(c.weightage), 0);

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
            <div className="brand-logo-icon" style={{ background: "#10b981" }}>📋</div>
            <div>
              <span className="brand-title">Falcon PBL Coordinator Portal</span>
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

            <div className="relative-popover">
              <button
                className="icon-pill-btn"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                🔔 <span className="notif-badge">2</span>
              </button>

              {notificationOpen && (
                <div className="airbnb-popover">
                  <div className="popover-title">Coordinator Notifications</div>
                  <div className="popover-item">
                    <strong>Rubric Weightage Verified</strong>
                    <span>Evaluation rubric total: {totalWeightage}%.</span>
                  </div>
                  <div className="popover-item">
                    <strong>Supervisor Allocations</strong>
                    <span>{assignments.length} supervisors assigned to class sections.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile-chip">
              <div className="avatar-circle">📋</div>
              <div className="chip-details">
                <span className="chip-name">{displayName}</span>
                <span className="chip-status">Role: Coordinator</span>
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

      {/* ================= VIEW 1: COORDINATOR DASHBOARD HOME ================= */}
      {currentView === "home" && (
        <div className="airbnb-container">
          <div className="welcome-banner">
            <div>
              <h1 className="welcome-title">Welcome Back, {displayName} 👋</h1>
              <div className="cycle-status-strip">
                <span>📋 Coordinator Workspace • Active Academic Cycle:</span>
                <span className="status-badge-active">🟢 2026-27 OPEN</span>
              </div>
            </div>
          </div>

          {/* 4 Stats Cards Grid */}
          <div className="stats-grid">
            <div className="airbnb-card stat-card" onClick={() => setCurrentView("supervisorMapping")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-value">{assignments.length || allFaculty.length}</div>
              <div className="stat-label">Active Supervisors & Faculty (Click to Assign)</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("allocations")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">👥</div>
              <div className="stat-value">{allocatedTeams} / {totalTeams}</div>
              <div className="stat-label">Teams Allocated</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("rubricsCreator")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">📊</div>
              <div className="stat-value">{rubrics.length || 1}</div>
              <div className="stat-label">Evaluation Rubrics (Click to Edit)</div>
            </div>

            <div className="airbnb-card stat-card highlight-card" onClick={() => setCurrentView("auditLogs")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">🛡️</div>
              <div className="stat-value">{auditLogs.length}</div>
              <div className="stat-label">Audit Log Events (Click to View)</div>
            </div>
          </div>

          {/* Quick Administrative Actions for Coordinator */}
          <div className="airbnb-card vertical-actions-section">
            <div className="timeline-header" style={{ marginBottom: "24px" }}>
              <div>
                <h2 className="timeline-title">⚡ Quick Coordinator Actions</h2>
                <p className="timeline-desc">
                  Select a coordinator feature below to open its dedicated complete page.
                </p>
              </div>
            </div>

            <div className="vertical-actions-grid">
              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("supervisorMapping")}>
                <div className="action-icon-box green">👥</div>
                <div className="action-text-box">
                  <div className="action-card-title">Supervisor Mapping & Allocation</div>
                  <div className="action-card-sub">Assign faculty supervisors to 1st-8th sem sections (A, B, C)</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("rubricsCreator")}>
                <div className="action-icon-box coral">📊</div>
                <div className="action-text-box">
                  <div className="action-card-title">Rubrics & Criteria Creator</div>
                  <div className="action-card-sub">Define evaluation weightages, criteria & max marks</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("allocations")}>
                <div className="action-icon-box blue">📈</div>
                <div className="action-text-box">
                  <div className="action-card-title">Allocation Monitoring</div>
                  <div className="action-card-sub">Track team project allocations & supervisor approvals</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("auditLogs")}>
                <div className="action-icon-box dark">🛡️</div>
                <div className="action-text-box">
                  <div className="action-card-title">Process Audit Logs & Timelines</div>
                  <div className="action-card-sub">Inspect real-time system audit trails & activity logs</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: SUPERVISOR MAPPING FULL PAGE ================= */}
      {currentView === "supervisorMapping" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">👥 Supervisor Mapping & Section Allocation</h1>
            <p className="full-page-desc">Assign faculty supervisors to class sections (Semesters 1 to 8, Sections A, B, C).</p>
          </div>

          {/* Top Form: Assign Faculty as Supervisor */}
          <div className="airbnb-card" style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>➕ Assign Faculty to Class Section</h2>
            <form onSubmit={handleAssignSupervisor} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 180px", gap: "16px", alignItems: "end" }}>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Select Faculty Member ({allFaculty.length} Available)</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(Number(e.target.value))}
                  required
                >
                  {allFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.faculty_code} - {f.name} ({f.designation || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Select Class Section (1st - 8th Sem, A/B/C)</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(Number(e.target.value))}
                  required
                >
                  {allSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field" style={{ marginBottom: 0, paddingBottom: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    style={{ width: "auto", height: "auto" }}
                  />
                  Primary Guide
                </label>
              </div>

              <button type="submit" className="btn-primary-pill" style={{ height: "48px" }} disabled={loading}>
                {loading ? "Assigning..." : "➕ Assign Supervisor"}
              </button>
            </form>
          </div>

          {/* Bottom Table: All Registered Faculty & Assigned Sections */}
          <div className="airbnb-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                Faculty Master List & Section Assignments ({allFaculty.length} Professors)
              </h2>
            </div>

            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Search faculty by name, faculty code (e.g. FAC001), or assigned section..."
                value={supervisorSearch}
                onChange={(e) => setSupervisorSearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Faculty Code</th>
                    <th>Professor Name</th>
                    <th>Designation & Dept</th>
                    <th>Assigned Section</th>
                    <th>Quick Section Assignment (1st - 8th Sem)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacultyList.map((fac) => {
                    const currentAssign = assignments.find((a) => a.faculty_name === fac.name);
                    const defaultSecId = currentAssign
                      ? allSections.find((s) => s.name === currentAssign.section_name)?.id || allSections[0]?.id || 1
                      : allSections[0]?.id || 1;
                    const selectedSecId = rowSelections[fac.id] !== undefined ? rowSelections[fac.id] : defaultSecId;

                    return (
                      <tr key={fac.id}>
                        <td><code>{fac.faculty_code}</code></td>
                        <td>
                          <strong>{fac.name}</strong>
                          <span style={{ display: "block", fontSize: "12px", color: "var(--airbnb-gray)" }}>{fac.email}</span>
                        </td>
                        <td>{fac.designation || "Faculty"} • {fac.department || "CSE"}</td>
                        <td>
                          {currentAssign ? (
                            <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "13px", padding: "6px 12px" }}>
                              Section {currentAssign.section_name} 🟢
                            </span>
                          ) : (
                            <span className="legend-item" style={{ background: "#f0f2f5", color: "#65676b" }}>
                              ⚪ Unassigned
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <select
                              value={selectedSecId}
                              onChange={(e) => setRowSelections({ ...rowSelections, [fac.id]: Number(e.target.value) })}
                              style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "10px", width: "150px" }}
                            >
                              {allSections.map((sec) => (
                                <option key={sec.id} value={sec.id}>
                                  Section {sec.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}
                              onClick={() => handleQuickAssign(fac.id, selectedSecId)}
                            >
                              Assign
                            </button>
                          </div>
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

      {/* ================= VIEW 3: RUBRICS CREATOR FULL PAGE ================= */}
      {currentView === "rubricsCreator" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📊 Evaluation Rubrics & Criteria Creator</h1>
            <p className="full-page-desc">Define predefined evaluation criteria, weightages, and max marks visible to supervisors & students.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px" }}>
            {/* Add Criteria Form */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>➕ Add New Criteria</h2>
              <form onSubmit={handleAddCriteria}>
                <div className="modal-field">
                  <label>Criteria Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Code Architecture & Design"
                    value={newCriteriaName}
                    onChange={(e) => setNewCriteriaName(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Weightage Percentage (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCriteriaWeightage}
                    onChange={(e) => setNewCriteriaWeightage(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Maximum Marks</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCriteriaMaxMarks}
                    onChange={(e) => setNewCriteriaMaxMarks(Number(e.target.value))}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary-pill" style={{ width: "100%", marginTop: "12px" }}>
                  + Add Criteria to Rubric
                </button>
              </form>
            </div>

            {/* Existing Rubrics Table */}
            <div className="airbnb-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Standard PBL Evaluation Rubric</h2>
                <span className="legend-item" style={{ background: totalWeightage === 100 ? "#e7f7ef" : "#fff8e6", color: totalWeightage === 100 ? "#0f8a5f" : "#b7791f", fontWeight: 800 }}>
                  Total Weightage: {totalWeightage}% {totalWeightage === 100 ? "✔ Verified" : ""}
                </span>
              </div>

              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Evaluation Criteria Name</th>
                      <th>Weightage</th>
                      <th>Max Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((c, idx) => (
                      <tr key={idx}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>
                            {c.weightage}%
                          </span>
                        </td>
                        <td>{c.max_marks} Marks</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: ALLOCATIONS MONITORING FULL PAGE ================= */}
      {currentView === "allocations" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📈 Team Allocation Monitoring</h1>
            <p className="full-page-desc">Track project allocations and supervisor approvals across all 108 student teams.</p>
          </div>

          <div className="airbnb-card">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "13px", color: "var(--airbnb-gray)" }}>Total Teams</span>
                <h3 style={{ fontSize: "28px", fontWeight: 900, margin: "4px 0 0", color: "var(--airbnb-dark)" }}>{totalTeams}</h3>
              </div>
              <div style={{ background: "#e7f7ef", padding: "18px", borderRadius: "14px", border: "1px solid #a7f3d0" }}>
                <span style={{ fontSize: "13px", color: "#0f8a5f" }}>Allocated Teams</span>
                <h3 style={{ fontSize: "28px", fontWeight: 900, margin: "4px 0 0", color: "#0f8a5f" }}>{allocatedTeams}</h3>
              </div>
              <div style={{ background: "#fff8e6", padding: "18px", borderRadius: "14px", border: "1px solid #fde68a" }}>
                <span style={{ fontSize: "13px", color: "#b7791f" }}>Pending Allocations</span>
                <h3 style={{ fontSize: "28px", fontWeight: 900, margin: "4px 0 0", color: "#b7791f" }}>{totalTeams - allocatedTeams}</h3>
              </div>
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project ID</th>
                    <th>Project Title</th>
                    <th>Guide Faculty</th>
                    <th>Assigned Team</th>
                    <th>Allocation Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>PRJ001</code></td>
                    <td><strong>AI-Powered Healthcare Diagnostic Portal</strong></td>
                    <td>Dr. Anand V</td>
                    <td>Team Falcon CS-A1</td>
                    <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f" }}>ALLOCATED</span></td>
                  </tr>
                  <tr>
                    <td><code>PRJ002</code></td>
                    <td><strong>Blockchain Supply Chain Tracking System</strong></td>
                    <td>Prof. Sneha K</td>
                    <td>Team Nexus CS-B2</td>
                    <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f" }}>ALLOCATED</span></td>
                  </tr>
                  <tr>
                    <td><code>PRJ003</code></td>
                    <td><strong>Smart Campus IoT Energy Optimizer</strong></td>
                    <td>Dr. Rajesh M</td>
                    <td>Team Cyber CS-C3</td>
                    <td><span className="legend-item" style={{ background: "#fff8e6", color: "#b7791f" }}>PENDING</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 5: PROCESS AUDIT LOGS FULL PAGE ================= */}
      {currentView === "auditLogs" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">🛡️ Process Audit Logs & History</h1>
            <p className="full-page-desc">Inspect real-time audit logs, cycle status changes, and supervisor assignments.</p>
          </div>

          <div className="airbnb-card">
            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Filter logs by action (e.g. OPEN_CYCLE, UPLOAD_FACULTY) or target entity..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Action Performed</th>
                    <th>Target Entity</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td><code>#{log.id}</code></td>
                      <td>
                        <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>
                          {log.action}
                        </span>
                      </td>
                      <td><strong>{log.entity_name}</strong></td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
