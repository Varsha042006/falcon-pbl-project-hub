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
  co_code?: string;
  name: string;
  weightage: number;
  max_marks: number;
  level5_desc?: string;
  level4_desc?: string;
  level3_desc?: string;
  level2_desc?: string;
  level1_desc?: string;
}

export interface RubricItem {
  id: number;
  name: string;
  description: string;
}

export interface PblTimelineItem {
  id: number;
  feature_key: string;
  feature_title: string;
  description: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
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
  timelines: PblTimelineItem[];
  auditLogs: AuditLogItem[];
}

type CoordinatorPageView =
  | "home"
  | "supervisorMapping"
  | "rubricsCreator"
  | "allocations"
  | "publishTimelines";

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
  timelines: initialTimelines,
  auditLogs,
}: AirbnbCoordinatorDashboardProps) {
  const [currentView, setCurrentView] = useState<CoordinatorPageView>("home");
  const [assignments, setAssignments] = useState<SupervisorAssignment[]>(initialAssignments);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);

  // Search filters
  const [supervisorSearch, setSupervisorSearch] = useState("");

  // Assign Supervisor Form State
  const [selectedFacultyId, setSelectedFacultyId] = useState<number>(allFaculty[0]?.id || 1);
  const [selectedSectionId, setSelectedSectionId] = useState<number>(allSections[0]?.id || 1);
  const [isPrimary, setIsPrimary] = useState(true);

  // Per-row section selection state
  const [rowSelections, setRowSelections] = useState<Record<number, number>>({});

  // Rubrics View Mode: "viewRubric" (Official GM University Document View) vs "editRubric"
  const [rubricTab, setRubricTab] = useState<"viewRubric" | "editRubric">("viewRubric");

  // Criteria form & editing state
  const [criteria, setCriteria] = useState<RubricCriteria[]>(initialCriteria);
  const [newCoCode, setNewCoCode] = useState("CO5");
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaWeightage, setNewCriteriaWeightage] = useState(25);
  const [newCriteriaMaxMarks, setNewCriteriaMaxMarks] = useState(5);
  const [newLevel5, setNewLevel5] = useState("");
  const [newLevel4, setNewLevel4] = useState("");
  const [newLevel3, setNewLevel3] = useState("");
  const [newLevel2, setNewLevel2] = useState("");
  const [newLevel1, setNewLevel1] = useState("");

  // Inline Criteria Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCoCode, setEditCoCode] = useState("CO5");
  const [editName, setEditName] = useState("");
  const [editWeightage, setEditWeightage] = useState(25);
  const [editMaxMarks, setEditMaxMarks] = useState(5);
  const [editLevel5, setEditLevel5] = useState("");
  const [editLevel4, setEditLevel4] = useState("");
  const [editLevel3, setEditLevel3] = useState("");
  const [editLevel2, setEditLevel2] = useState("");
  const [editLevel1, setEditLevel1] = useState("");

  // Timelines state & forms
  const [timelineList, setTimelineList] = useState<PblTimelineItem[]>(initialTimelines);
  const [newFeatureTitle, setNewFeatureTitle] = useState("");
  const [newFeatureDesc, setNewFeatureDesc] = useState("");
  const [newStartTime, setNewStartTime] = useState("2026-08-10T09:00");
  const [newEndTime, setNewEndTime] = useState("2026-08-25T23:59");

  // Edit Mode for Timeline Item
  const [editingTimelineId, setEditingTimelineId] = useState<number | null>(null);
  const [editTimelineTitle, setEditTimelineTitle] = useState("");
  const [editTimelineDesc, setEditTimelineDesc] = useState("");
  const [editTimelineStart, setEditTimelineStart] = useState("");
  const [editTimelineEnd, setEditTimelineEnd] = useState("");
  const [editTimelineEnabled, setEditTimelineEnabled] = useState(true);

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

  // Publish New Custom Timeline Handler
  const handleCreateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureTitle || !newStartTime || !newEndTime) return;

    const newItem: PblTimelineItem = {
      id: Date.now(),
      feature_key: newFeatureTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now(),
      feature_title: newFeatureTitle,
      description: newFeatureDesc || `Timeline schedule for ${newFeatureTitle}`,
      start_time: newStartTime,
      end_time: newEndTime,
      is_enabled: true,
    };

    setTimelineList((prev) => [newItem, ...prev]);
    setNewFeatureTitle("");
    setNewFeatureDesc("");
    showToast(`Published timeline for "${newFeatureTitle}"!`);

    try {
      const res = await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TIMELINE",
          data: newItem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setTimelineList((prev) =>
            prev.map((t) => (t.id === newItem.id ? { ...t, id: data.id, feature_key: data.feature_key } : t))
          );
        }
      }
    } catch {
      // Toast already shown
    }
  };

  // Start Editing Timeline Item
  const handleStartEditTimeline = (t: PblTimelineItem) => {
    setEditingTimelineId(t.id);
    setEditTimelineTitle(t.feature_title);
    setEditTimelineDesc(t.description);
    setEditTimelineStart(t.start_time);
    setEditTimelineEnd(t.end_time);
    setEditTimelineEnabled(t.is_enabled);
  };

  // Save Editing Timeline Item
  const handleSaveTimelineEdit = async (t: PblTimelineItem) => {
    const updated: PblTimelineItem = {
      ...t,
      feature_title: editTimelineTitle,
      description: editTimelineDesc,
      start_time: editTimelineStart,
      end_time: editTimelineEnd,
      is_enabled: editTimelineEnabled,
    };

    setTimelineList((prev) => prev.map((item) => (item.id === t.id ? updated : item)));
    setEditingTimelineId(null);
    showToast(`Updated timeline for "${editTimelineTitle}"!`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TIMELINE",
          data: updated,
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Delete Timeline Entry
  const handleDeleteTimeline = async (t: PblTimelineItem) => {
    setTimelineList((prev) => prev.filter((item) => item.id !== t.id));
    showToast(`Deleted timeline "${t.feature_title}"`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_TIMELINE",
          data: { id: t.id },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Add New Criteria Handler
  const handleAddCriteria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaName) return;

    const newItem: RubricCriteria = {
      co_code: newCoCode,
      name: newCriteriaName,
      weightage: newCriteriaWeightage,
      max_marks: newCriteriaMaxMarks,
      level5_desc: newLevel5 || `Executes exceptional ${newCriteriaName} (5M)`,
      level4_desc: newLevel4 || `Performs thorough ${newCriteriaName} (4M)`,
      level3_desc: newLevel3 || `Conducts effective ${newCriteriaName} (3M)`,
      level2_desc: newLevel2 || `Applies basic ${newCriteriaName} (2M)`,
      level1_desc: newLevel1 || `Shows limited ${newCriteriaName} (1M)`,
    };

    setCriteria((prev) => [...prev, newItem]);
    setNewCriteriaName("");
    setNewLevel5("");
    setNewLevel4("");
    setNewLevel3("");
    setNewLevel2("");
    setNewLevel1("");
    showToast(`Added criteria "${newCriteriaName}" (${newCriteriaMaxMarks} Marks)!`);

    try {
      const res = await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CRITERIA",
          data: newItem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setCriteria((prev) =>
            prev.map((c, i) => (i === prev.length - 1 ? { ...c, id: data.id } : c))
          );
        }
      }
    } catch {
      // Toast already shown
    }
  };

  // Start Edit Mode for Criteria Row
  const handleStartEdit = (idx: number, item: RubricCriteria) => {
    setEditingIndex(idx);
    setEditCoCode(item.co_code || "CO5");
    setEditName(item.name);
    setEditWeightage(item.weightage);
    setEditMaxMarks(item.max_marks);
    setEditLevel5(item.level5_desc || "");
    setEditLevel4(item.level4_desc || "");
    setEditLevel3(item.level3_desc || "");
    setEditLevel2(item.level2_desc || "");
    setEditLevel1(item.level1_desc || "");
  };

  // Save Edit Mode for Criteria Row
  const handleSaveEdit = async (idx: number) => {
    if (!editName) return;

    const targetItem = criteria[idx];

    const updatedItem: RubricCriteria = {
      ...targetItem,
      co_code: editCoCode,
      name: editName,
      weightage: editWeightage,
      max_marks: editMaxMarks,
      level5_desc: editLevel5,
      level4_desc: editLevel4,
      level3_desc: editLevel3,
      level2_desc: editLevel2,
      level1_desc: editLevel1,
    };

    setCriteria((prev) => prev.map((item, i) => (i === idx ? updatedItem : item)));
    setEditingIndex(null);
    showToast(`Updated criteria "${editName}"!`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_CRITERIA",
          data: updatedItem,
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  // Delete Criteria Row
  const handleDeleteCriteria = async (idx: number, item: RubricCriteria) => {
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
    showToast(`Deleted criteria "${item.name}"`);

    try {
      await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELETE_CRITERIA",
          data: { id: item.id },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

  const filteredFacultyList = allFaculty.filter(
    (f) =>
      f.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      f.faculty_code.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
      (f.department && f.department.toLowerCase().includes(supervisorSearch.toLowerCase()))
  );

  const totalMarks = criteria.reduce((acc, c) => acc + Number(c.max_marks), 0);

  // Helper to determine feature status
  const getTimelineStatus = (start?: string, end?: string, isEnabled?: boolean) => {
    if (!isEnabled) return { text: "⚪ DISABLED", color: "#65676b", bg: "#f0f2f5" };
    if (!start || !end) return { text: "🟢 OPEN", color: "#0f8a5f", bg: "#e7f7ef" };
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) return { text: "⏳ SCHEDULED", color: "#b7791f", bg: "#fff8e6" };
    if (now > e) return { text: "🔴 CLOSED", color: "#c62828", bg: "#ffebe9" };
    return { text: "🟢 OPEN (Active)", color: "#0f8a5f", bg: "#e7f7ef" };
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
                    <span>Evaluation rubric total: {totalMarks} Marks.</span>
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
              <div className="stat-label">Evaluation Rubrics (Click to View / Edit)</div>
            </div>

            <div className="airbnb-card stat-card highlight-card" onClick={() => setCurrentView("publishTimelines")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">🗓️</div>
              <div className="stat-value">{timelineList.length}</div>
              <div className="stat-label">Feature Timelines & Schedules (Click to Set)</div>
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
                  <div className="action-card-title">Evaluation Rubrics & Assessment Format</div>
                  <div className="action-card-sub">View official GM University Rubrics document & edit criteria</div>
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

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("publishTimelines")}>
                <div className="action-icon-box dark">🗓️</div>
                <div className="action-text-box">
                  <div className="action-card-title">Publish Feature Timelines & Schedules</div>
                  <div className="action-card-sub">Write and publish custom timelines for student team formation & faculty mark submission</div>
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

      {/* ================= VIEW 3: RUBRICS CREATOR & DOCUMENT VIEW FULL PAGE ================= */}
      {currentView === "rubricsCreator" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">📊 Evaluation Rubrics & Assessment Format</h1>
            <p className="full-page-desc">Official GM University Project-Based Learning (PBL) Assessment Rubric - Review 3 (20 Marks).</p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }} className="no-print">
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className={`btn-secondary-pill ${rubricTab === "viewRubric" ? "active" : ""}`}
                style={{
                  background: rubricTab === "viewRubric" ? "var(--airbnb-dark)" : "#ffffff",
                  color: rubricTab === "viewRubric" ? "#ffffff" : "var(--airbnb-dark)",
                  borderColor: "var(--airbnb-dark)",
                  fontWeight: 800,
                  padding: "10px 24px"
                }}
                onClick={() => setRubricTab("viewRubric")}
              >
                📜 View Official Rubric Document
              </button>
              <button
                className={`btn-secondary-pill ${rubricTab === "editRubric" ? "active" : ""}`}
                style={{
                  background: rubricTab === "editRubric" ? "var(--airbnb-dark)" : "#ffffff",
                  color: rubricTab === "editRubric" ? "#ffffff" : "var(--airbnb-dark)",
                  borderColor: "var(--airbnb-dark)",
                  fontWeight: 800,
                  padding: "10px 24px"
                }}
                onClick={() => setRubricTab("editRubric")}
              >
                ⚙️ Create / Edit Criteria
              </button>
            </div>

            {rubricTab === "viewRubric" && (
              <button
                type="button"
                className="btn-primary-pill"
                style={{ background: "#10b981", color: "#ffffff", padding: "10px 24px", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}
                onClick={() => window.print()}
              >
                📥 Download / Print Rubric Document (PDF)
              </button>
            )}
          </div>

          {/* MODE A: OFFICIAL GM UNIVERSITY RUBRIC DOCUMENT VIEW */}
          {rubricTab === "viewRubric" && (
            <div id="rubric-document-to-print" className="airbnb-card" style={{ padding: "40px", background: "#ffffff", border: "2px solid #1c1e21", borderRadius: "8px", color: "#000000" }}>
              {/* Document Header */}
              <div style={{ textAlign: "center", borderBottom: "2px solid #000000", paddingBottom: "16px", marginBottom: "24px" }}>
                <p style={{ margin: 0, fontSize: "12px", fontStyle: "italic" }}>Srishyla Education Trust ®</p>
                <h1 style={{ margin: "4px 0 2px", fontSize: "26px", fontWeight: 900, letterSpacing: "1px", color: "#000000" }}>GM UNIVERSITY</h1>
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700 }}> (Established under the Karnataka State Act No. 19 of 2023) </p>
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
                  RUBRIC FOR PROJECT-BASED LEARNING (PBL) ASSESSMENT WITH A TOTAL OF {totalMarks} MARKS, CATEGORIZED BASED ON BLOOM'S TAXONOMY:
                </p>
              </div>

              {/* Metadata Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 700, marginBottom: "20px", padding: "10px 14px", border: "1px solid #000", background: "#f8fafc" }}>
                <div><strong>Semester:</strong> V</div>
                <div><strong>Sec:</strong> 5A</div>
                <div><strong>Subcode:</strong> UE24CS2406</div>
                <div><strong>Project Name:</strong> [ Student Team Project Title ]</div>
              </div>

              {/* Bloom's Taxonomy Rubrics Table */}
              <div style={{ overflowX: "auto", marginBottom: "28px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                      <th style={{ border: "1px solid #000", padding: "10px 6px", width: "40px" }}>CO</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px", width: "140px" }}>Criteria</th>
                      <th style={{ border: "1px solid #000", padding: "10px 6px", width: "45px" }}>Marks</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 5</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 4</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 3</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 2</th>
                      <th style={{ border: "1px solid #000", padding: "10px 8px" }}>Level 1</th>
                      <th style={{ border: "1px solid #000", padding: "10px 6px", width: "65px" }}>Obtained Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((c, idx) => (
                      <tr key={idx} style={{ textAlign: "left", verticalAlign: "top" }}>
                        <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>
                          {c.co_code || "CO5"}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "10px 8px", fontWeight: 800 }}>
                          {c.name}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "10px 6px", textAlign: "center", fontWeight: 800 }}>
                          {c.max_marks}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>
                          <span style={{ fontSize: "11px" }}>{c.level5_desc || `Executes exceptional ${c.name} (5M)`}</span>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>
                          <span style={{ fontSize: "11px" }}>{c.level4_desc || `Performs thorough ${c.name} (4M)`}</span>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>
                          <span style={{ fontSize: "11px" }}>{c.level3_desc || `Conducts effective ${c.name} (3M)`}</span>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>
                          <span style={{ fontSize: "11px" }}>{c.level2_desc || `Applies basic ${c.name} (2M)`}</span>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px" }}>
                          <span style={{ fontSize: "11px" }}>{c.level1_desc || `Shows limited ${c.name} (1M)`}</span>
                        </td>
                        <td style={{ border: "1px solid #000", padding: "8px", background: "#fafafa" }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Note Instructions */}
              <div style={{ fontSize: "12px", marginBottom: "24px", lineHeight: "1.6" }}>
                <strong>Note:</strong>
                <ol style={{ margin: "4px 0 0", paddingLeft: "20px" }}>
                  <li>Students who have not met the guides regularly will be awarded <strong>zero marks</strong>.</li>
                  <li>Students who do not present their project progress according to the format or those who miss the presentation will be awarded <strong>zero marks</strong>.</li>
                </ol>
              </div>

              {/* Student Evaluation Summary Table */}
              <div style={{ marginBottom: "32px" }}>
                <p style={{ fontWeight: 800, fontSize: "13px", margin: "0 0 8px" }}>Project Name: [ Student Team Project Title ]</p>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "center" }}>
                      <th style={{ border: "1px solid #000", padding: "8px" }}>Student Name</th>
                      <th style={{ border: "1px solid #000", padding: "8px" }}>USN</th>
                      <th style={{ border: "1px solid #000", padding: "8px" }}>
                        CO5 ({criteria.filter((c) => (c.co_code || "CO5") === "CO5").reduce((a, b) => a + Number(b.max_marks), 0)} Marks)
                      </th>
                      <th style={{ border: "1px solid #000", padding: "8px" }}>
                        CO6 ({criteria.filter((c) => (c.co_code || "CO5") === "CO6").reduce((a, b) => a + Number(b.max_marks), 0)} Marks)
                      </th>
                      <th style={{ border: "1px solid #000", padding: "8px" }}>Total ({totalMarks} Marks)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i} style={{ height: "32px" }}>
                        <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                        <td style={{ border: "1px solid #000", padding: "6px" }}></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Declaration Block */}
              <div style={{ borderTop: "1px solid #000", paddingTop: "18px", marginTop: "24px" }}>
                <p style={{ fontSize: "12px", fontStyle: "italic", marginBottom: "24px" }}>
                  I hereby declare that I have conducted the Review 3 presentation of the students, analyzed their progress, and evaluated their performance. The marks have been entered as per their performance in the review.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "13px", lineHeight: "1.8" }}>
                  <div>
                    <p style={{ margin: 0 }}><strong>Guide Name:</strong> Dr. Anand V</p>
                    <p style={{ margin: 0 }}><strong>Designation:</strong> Professor</p>
                    <p style={{ margin: 0 }}><strong>Department:</strong> CSE</p>
                    <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p style={{ margin: "16px 0 0" }}><strong>Signature:</strong> ______________________</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <p style={{ margin: 0 }}><strong>Signature of Faculty Mentor</strong></p>
                    <p style={{ margin: "40px 0 0" }}><strong>Signature of HOD</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE B: EDIT / CREATE RUBRICS CRITERIA */}
          {rubricTab === "editRubric" && (
            <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px" }}>
              {/* Add Criteria Form */}
              <div className="airbnb-card">
                <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>➕ Add New Criteria</h2>
                <form onSubmit={handleAddCriteria}>
                  <div className="modal-field">
                    <label>Course Outcome (CO)</label>
                    <select value={newCoCode} onChange={(e) => setNewCoCode(e.target.value)}>
                      <option value="CO5">CO5 - Evaluation & Testing</option>
                      <option value="CO6">CO6 - Demonstration & Future Scope</option>
                    </select>
                  </div>

                  <div className="modal-field">
                    <label>Criteria Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Testing & Validation"
                      value={newCriteriaName}
                      onChange={(e) => setNewCriteriaName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-field">
                    <label>Max Marks</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newCriteriaMaxMarks}
                      onChange={(e) => setNewCriteriaMaxMarks(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="modal-field">
                    <label>Level 5 Description (5 Marks)</label>
                    <input
                      type="text"
                      placeholder="Executes exceptional testing with complete validation"
                      value={newLevel5}
                      onChange={(e) => setNewLevel5(e.target.value)}
                    />
                  </div>

                  <div className="modal-field">
                    <label>Level 4 Description (4 Marks)</label>
                    <input
                      type="text"
                      placeholder="Performs thorough testing with reliable validation"
                      value={newLevel4}
                      onChange={(e) => setNewLevel4(e.target.value)}
                    />
                  </div>

                  <div className="modal-field">
                    <label>Level 3 Description (3 Marks)</label>
                    <input
                      type="text"
                      placeholder="Conducts effective testing with minor limitations"
                      value={newLevel3}
                      onChange={(e) => setNewLevel3(e.target.value)}
                    />
                  </div>

                  <div className="modal-field">
                    <label>Level 2 Description (2 Marks)</label>
                    <input
                      type="text"
                      placeholder="Applies basic testing with partial validation"
                      value={newLevel2}
                      onChange={(e) => setNewLevel2(e.target.value)}
                    />
                  </div>

                  <div className="modal-field">
                    <label>Level 1 Description (1 Mark)</label>
                    <input
                      type="text"
                      placeholder="Shows limited testing with insufficient validation"
                      value={newLevel1}
                      onChange={(e) => setNewLevel1(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-primary-pill" style={{ width: "100%", marginTop: "12px" }}>
                    + Add Criteria to Rubric
                  </button>
                </form>
              </div>

              {/* Editable Rubrics Criteria Table */}
              <div className="airbnb-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Review 3 Evaluation Criteria List ({criteria.length} Items)</h2>
                  <span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>
                    Total Max Marks: {totalMarks} Marks 🟢
                  </span>
                </div>

                <div className="audit-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>CO</th>
                        <th>Evaluation Criteria Name & Level Descriptions</th>
                        <th>Max Marks</th>
                        <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, idx) => {
                        const isEditing = editingIndex === idx;

                        return (
                          <tr key={idx}>
                            <td>
                              {isEditing ? (
                                <select
                                  value={editCoCode}
                                  onChange={(e) => setEditCoCode(e.target.value)}
                                  style={{ padding: "6px", fontSize: "13px", fontWeight: 800 }}
                                >
                                  <option value="CO5">CO5</option>
                                  <option value="CO6">CO6</option>
                                </select>
                              ) : (
                                <strong>{c.co_code || "CO5"}</strong>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <input
                                    type="text"
                                    placeholder="Criteria Name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ padding: "6px 10px", fontSize: "14px", fontWeight: 700, borderRadius: "8px", border: "1px solid var(--airbnb-coral)" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Level 5 Description"
                                    value={editLevel5}
                                    onChange={(e) => setEditLevel5(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Level 4 Description"
                                    value={editLevel4}
                                    onChange={(e) => setEditLevel4(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Level 3 Description"
                                    value={editLevel3}
                                    onChange={(e) => setEditLevel3(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Level 2 Description"
                                    value={editLevel2}
                                    onChange={(e) => setEditLevel2(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Level 1 Description"
                                    value={editLevel1}
                                    onChange={(e) => setEditLevel1(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: "12px" }}
                                  />
                                </div>
                              ) : (
                                <div>
                                  <strong style={{ fontSize: "15px", color: "var(--airbnb-dark)" }}>{c.name}</strong>
                                  <div style={{ fontSize: "11px", color: "var(--airbnb-gray)", marginTop: "4px", lineHeight: "1.4" }}>
                                    <div><strong>L5 (5M):</strong> {c.level5_desc || `Executes exceptional ${c.name}`}</div>
                                    <div><strong>L4 (4M):</strong> {c.level4_desc || `Performs thorough ${c.name}`}</div>
                                    <div><strong>L3 (3M):</strong> {c.level3_desc || `Conducts effective ${c.name}`}</div>
                                    <div><strong>L2 (2M):</strong> {c.level2_desc || `Applies basic ${c.name}`}</div>
                                    <div><strong>L1 (1M):</strong> {c.level1_desc || `Shows limited ${c.name}`}</div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={editMaxMarks}
                                  onChange={(e) => setEditMaxMarks(Number(e.target.value))}
                                  style={{ padding: "6px 10px", fontSize: "14px", borderRadius: "8px", border: "1px solid var(--airbnb-coral)", width: "70px" }}
                                />
                              ) : (
                                <span>{c.max_marks} Marks</span>
                              )}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    className="btn-primary-pill"
                                    style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981" }}
                                    onClick={() => handleSaveEdit(idx)}
                                  >
                                    💾 Save
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary-pill"
                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                    onClick={() => setEditingIndex(null)}
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
                                    onClick={() => handleStartEdit(idx, c)}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary-pill"
                                    style={{ padding: "6px 12px", fontSize: "12px", background: "#ffebe9", color: "#c62828", borderColor: "#ffcdd2" }}
                                    onClick={() => handleDeleteCriteria(idx, c)}
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
                    <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f" }}>ALLOCATED 🟢</span></td>
                  </tr>
                  <tr>
                    <td><code>PRJ002</code></td>
                    <td><strong>Blockchain Supply Chain Tracking System</strong></td>
                    <td>Prof. Sneha K</td>
                    <td>Team Nexus CS-B2</td>
                    <td><span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f" }}>ALLOCATED 🟢</span></td>
                  </tr>
                  <tr>
                    <td><code>PRJ003</code></td>
                    <td><strong>Smart Campus IoT Energy Optimizer</strong></td>
                    <td>Dr. Rajesh M</td>
                    <td>Team Cyber CS-C3</td>
                    <td><span className="legend-item" style={{ background: "#fff8e6", color: "#b7791f" }}>PENDING ⏳</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 5: PUBLISH TIMELINES FULL PAGE ================= */}
      {currentView === "publishTimelines" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Dashboard
            </button>
            <h1 className="full-page-title">🗓️ Publish Feature Timelines & Schedules</h1>
            <p className="full-page-desc">Write and publish custom feature timelines for student team formation, project selection, and faculty evaluation mark submission.</p>
          </div>

          {/* TOP SECTION: CREATE & PUBLISH CUSTOM FEATURE TIMELINE FORM */}
          <div className="airbnb-card" style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>➕ Create & Publish Custom Feature Timeline</h2>
            <form onSubmit={handleCreateTimeline} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Feature Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Student Team Formation & Registration"
                  value={newFeatureTitle}
                  onChange={(e) => setNewFeatureTitle(e.target.value)}
                  required
                />
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Feature Description</label>
                <input
                  type="text"
                  placeholder="e.g. Controls when students can form teams, add members, and choose team leaders."
                  value={newFeatureDesc}
                  onChange={(e) => setNewFeatureDesc(e.target.value)}
                />
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Start Date & Time (Opening)</label>
                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  required
                  style={{ padding: "12px 14px", borderRadius: "10px" }}
                />
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>End Date & Time (Closing Deadline)</label>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  required
                  style={{ padding: "12px 14px", borderRadius: "10px" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", textAlign: "right", marginTop: "8px" }}>
                <button type="submit" className="btn-primary-pill" style={{ height: "48px", padding: "0 32px" }}>
                  🚀 Publish Timeline
                </button>
              </div>
            </form>
          </div>

          {/* BOTTOM SECTION: PUBLISHED FEATURE TIMELINES LIST */}
          <div className="airbnb-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                📋 Published Feature Timelines ({timelineList.length} Active Schedules)
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
              {timelineList.map((t) => {
                const status = getTimelineStatus(t.start_time, t.end_time, t.is_enabled);
                const isEditing = editingTimelineId === t.id;

                return (
                  <div
                    key={t.id}
                    style={{
                      background: "#f8fafc",
                      padding: "24px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {isEditing ? (
                      /* EDIT MODE FORM */
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "14px" }}>✏️ Edit Published Timeline</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                          <div className="modal-field" style={{ marginBottom: 0 }}>
                            <label>Feature Title</label>
                            <input
                              type="text"
                              value={editTimelineTitle}
                              onChange={(e) => setEditTimelineTitle(e.target.value)}
                              required
                            />
                          </div>

                          <div className="modal-field" style={{ marginBottom: 0 }}>
                            <label>Description</label>
                            <input
                              type="text"
                              value={editTimelineDesc}
                              onChange={(e) => setEditTimelineDesc(e.target.value)}
                            />
                          </div>

                          <div className="modal-field" style={{ marginBottom: 0 }}>
                            <label>Start Date & Time</label>
                            <input
                              type="datetime-local"
                              value={editTimelineStart}
                              onChange={(e) => setEditTimelineStart(e.target.value)}
                              required
                              style={{ padding: "10px 14px", borderRadius: "10px" }}
                            />
                          </div>

                          <div className="modal-field" style={{ marginBottom: 0 }}>
                            <label>End Date & Time</label>
                            <input
                              type="datetime-local"
                              value={editTimelineEnd}
                              onChange={(e) => setEditTimelineEnd(e.target.value)}
                              required
                              style={{ padding: "10px 14px", borderRadius: "10px" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
                            <input
                              type="checkbox"
                              checked={editTimelineEnabled}
                              onChange={(e) => setEditTimelineEnabled(e.target.checked)}
                              style={{ width: "18px", height: "18px" }}
                            />
                            Enable Feature
                          </label>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              className="btn-primary-pill"
                              style={{ padding: "8px 20px", fontSize: "13px", background: "#10b981" }}
                              onClick={() => handleSaveTimelineEdit(t)}
                            >
                              💾 Save Changes
                            </button>
                            <button
                              type="button"
                              className="btn-secondary-pill"
                              style={{ padding: "8px 20px", fontSize: "13px" }}
                              onClick={() => setEditingTimelineId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* READ DISPLAY MODE */
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0, color: "var(--airbnb-dark)" }}>
                              {t.feature_title}
                            </h3>
                            <span
                              className="legend-item"
                              style={{
                                background: status.bg,
                                color: status.color,
                                fontWeight: 800,
                                fontSize: "12px",
                                padding: "4px 12px",
                              }}
                            >
                              {status.text}
                            </span>
                          </div>

                          <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--airbnb-gray)" }}>{t.description}</p>

                          <div style={{ display: "flex", gap: "24px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                            <div>
                              <span style={{ color: "var(--airbnb-gray)", fontWeight: 500 }}>Start (Opening): </span>
                              {t.start_time ? new Date(t.start_time).toLocaleString() : "Not Set"}
                            </div>
                            <div>
                              <span style={{ color: "var(--airbnb-gray)", fontWeight: 500 }}>End (Closing): </span>
                              {t.end_time ? new Date(t.end_time).toLocaleString() : "Not Set"}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn-secondary-pill"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                            onClick={() => handleStartEditTimeline(t)}
                          >
                            ✏️ Edit Timeline
                          </button>
                          <button
                            type="button"
                            className="btn-secondary-pill"
                            style={{ padding: "8px 16px", fontSize: "13px", background: "#ffebe9", color: "#c62828", borderColor: "#ffcdd2" }}
                            onClick={() => handleDeleteTimeline(t)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
