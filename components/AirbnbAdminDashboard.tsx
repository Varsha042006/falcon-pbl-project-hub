"use client";

import { useState } from "react";

export interface Cycle {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface FacultyRecord {
  id: number;
  faculty_code: string;
  name: string;
  email: string;
  designation: string | null;
  department: string | null;
  is_active: boolean;
}

export interface StudentRecord {
  id: number;
  usn: string;
  name: string;
  email: string | null;
  section_name: string | null;
  mentor_name: string | null;
  is_active: boolean;
}

interface AirbnbAdminDashboardProps {
  initialCycles: Cycle[];
  studentCount: number;
  facultyCount: number;
  teamCount: number;
  projectCount: number;
  pendingApprovalsCount: number;
  facultyList: FacultyRecord[];
  studentsList: StudentRecord[];
  minTeamSize: number;
  maxTeamSize: number;
}

type AdminPageView =
  | "home"
  | "createCycle"
  | "uploadFaculty"
  | "uploadStudents"
  | "viewStudents"
  | "viewFaculty"
  | "rules";

export function AirbnbAdminDashboard({
  initialCycles,
  studentCount,
  facultyCount,
  teamCount,
  projectCount,
  pendingApprovalsCount,
  facultyList,
  studentsList,
  minTeamSize,
  maxTeamSize,
}: AirbnbAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminPageView>("home");
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [faculties, setFaculties] = useState<FacultyRecord[]>(facultyList);
  const [students, setStudents] = useState<StudentRecord[]>(studentsList);

  const [selectedCycleId, setSelectedCycleId] = useState<number>(
    initialCycles.find((c) => c.is_active)?.id || initialCycles[0]?.id || 1
  );

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Search Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  // Forms state
  const [cycleName, setCycleName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cycleIsActive, setCycleIsActive] = useState(true);

  const [teamMin, setTeamMin] = useState(minTeamSize);
  const [teamMax, setTeamMax] = useState(maxTeamSize);

  const [facultyFile, setFacultyFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Create Cycle Submit with Optimistic UI Update
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName) return;
    setLoading(true);

    const tempId = Date.now();
    const newCycle: Cycle = {
      id: tempId,
      name: cycleName,
      start_date: startDate || null,
      end_date: endDate || null,
      is_active: cycleIsActive,
    };

    // Optimistic UI Update
    setCycles((prev) => [
      newCycle,
      ...prev.map((c) => (cycleIsActive ? { ...c, is_active: false } : c)),
    ]);
    if (cycleIsActive) {
      setSelectedCycleId(tempId);
    }
    showToast("Academic cycle created & activated!");

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CYCLE",
          data: { name: cycleName, start_date: startDate, end_date: endDate, is_active: cycleIsActive },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setCycles((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: data.id } : c))
          );
          if (cycleIsActive) setSelectedCycleId(data.id);
        }
      }
    } catch {
      showToast("Cycle created locally", "success");
    }

    setCycleName("");
    setStartDate("");
    setEndDate("");
    setLoading(false);
  };

  // Open Cycle Handler - Opens access for all dashboards across system
  const handleOpenCycle = async (id: number, name: string) => {
    setLoading(true);
    // Optimistic UI Update
    setCycles((prev) => prev.map((c) => ({ ...c, is_active: c.id === id })));
    setSelectedCycleId(id);
    showToast(`🚀 Academic Cycle "${name}" is now OPEN for all dashboards!`);

    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OPEN_CYCLE",
          data: { id },
        }),
      });
    } catch {
      // Toast already shown
    }
    setLoading(false);
  };

  // Toggle / Deactivate Cycle Active Status
  const handleToggleCycle = async (id: number, currentActive: boolean) => {
    const nextActive = !currentActive;
    setLoading(true);

    // Optimistic UI Update
    setCycles((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, is_active: nextActive }
          : nextActive
          ? { ...c, is_active: false }
          : c
      )
    );
    showToast(nextActive ? "Academic cycle activated!" : "🔒 Academic cycle deactivated!");

    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_CYCLE",
          data: { id, is_active: nextActive },
        }),
      });
    } catch {
      // Toast already shown
    }
    setLoading(false);
  };

  // Save Team Rules Submit
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SETTINGS",
          data: { min_team_size: teamMin, max_team_size: teamMax, current_cycle: selectedCycleId },
        }),
      });
      if (res.ok) {
        showToast("Team rules & size limits saved successfully!");
      }
    } catch {
      showToast("Failed to save team rules", "error");
    }
    setLoading(false);
  };

  // Upload Faculty CSV
  const handleUploadFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyFile) {
      showToast("Please select a file to upload", "error");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("action", "UPLOAD_FACULTY");
    fd.append("file", facultyFile);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Uploaded "${data.fileName}"! Processed ${data.successCount} faculty accounts.`);
        setCurrentView("viewFaculty");
        setFacultyFile(null);
      } else {
        showToast("Failed to process faculty file", "error");
      }
    } catch {
      showToast("Error processing file upload", "error");
    }
    setLoading(false);
  };

  // Upload Student CSV
  const handleUploadStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFile) {
      showToast("Please select a file to upload", "error");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("action", "UPLOAD_STUDENT");
    fd.append("file", studentFile);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Uploaded "${data.fileName}"! Processed ${data.successCount} student accounts.`);
        setCurrentView("viewStudents");
        setStudentFile(null);
      } else {
        showToast("Failed to process student file", "error");
      }
    } catch {
      showToast("Error processing file upload", "error");
    }
    setLoading(false);
  };

  // Filtered Students & Faculty List
  const filteredStudents = students.filter(
    (s) =>
      s.usn.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.section_name && s.section_name.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const filteredFaculty = faculties.filter(
    (f) =>
      f.faculty_code.toLowerCase().includes(facultySearch.toLowerCase()) ||
      f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
      (f.department && f.department.toLowerCase().includes(facultySearch.toLowerCase()))
  );

  return (
    <div className="airbnb-admin-root">
      {/* Toast Notification */}
      {toast && (
        <div className={`airbnb-toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "⚠️"} {toast.msg}
        </div>
      )}

      {/* Persistent Navigation Header */}
      <header className="airbnb-header">
        <div className="airbnb-header-container">
          <div className="airbnb-brand">
            <div className="brand-logo-icon">🦅</div>
            <div>
              <span className="brand-title">Falcon PBL Project Hub</span>
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
              <span className="cycle-label">Academic Year:</span>
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                className="airbnb-select-pill"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_active ? "🟢 Active" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative-popover">
              <button
                className="icon-pill-btn"
                onClick={() => setNotificationOpen(!notificationOpen)}
              >
                🔔 <span className="notif-badge">3</span>
              </button>

              {notificationOpen && (
                <div className="airbnb-popover">
                  <div className="popover-title">Notifications</div>
                  <div className="popover-item">
                    <strong>PBL Cycle Initiated</strong>
                    <span>Academic Year 2026-27 configured.</span>
                  </div>
                  <div className="popover-item">
                    <strong>Faculty Directory</strong>
                    <span>Full page faculty management active.</span>
                  </div>
                  <div className="popover-item">
                    <strong>Student Directory</strong>
                    <span>200 student USNs loaded.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile-chip">
              <div className="avatar-circle">👤</div>
              <div className="chip-details">
                <span className="chip-name">Admin</span>
                <span className="chip-status">Last Login: Today</span>
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

      {/* ================= VIEW 1: HOME DASHBOARD ================= */}
      {currentView === "home" && (
        <div className="airbnb-container">
          <div className="welcome-banner">
            <div>
              <h1 className="welcome-title">Welcome Back, Administrator 👋</h1>
              <div className="cycle-status-strip">
                <span>📅 Academic Cycle:</span>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                  className="banner-select"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="status-badge-active">🟢 Active</span>
              </div>
            </div>
          </div>

          {/* 5 Stats Cards Grid */}
          <div className="stats-grid">
            <div className="airbnb-card stat-card" onClick={() => setCurrentView("viewStudents")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">👨‍🎓</div>
              <div className="stat-value">{studentCount}</div>
              <div className="stat-label">Students (Click to Open Page)</div>
            </div>

            <div className="airbnb-card stat-card" onClick={() => setCurrentView("viewFaculty")} style={{ cursor: "pointer" }}>
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-value">{facultyCount}</div>
              <div className="stat-label">Faculty (Click to Open Page)</div>
            </div>

            <div className="airbnb-card stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{teamCount}</div>
              <div className="stat-label">Teams</div>
            </div>

            <div className="airbnb-card stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-value">{projectCount}</div>
              <div className="stat-label">Projects</div>
            </div>

            <div className="airbnb-card stat-card highlight-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{pendingApprovalsCount}</div>
              <div className="stat-label">Pending Approvals</div>
            </div>
          </div>

          {/* Vertical Actions Panel */}
          <div className="airbnb-card vertical-actions-section">
            <div className="timeline-header" style={{ marginBottom: "24px" }}>
              <div>
                <h2 className="timeline-title">⚡ Quick Administrative Actions</h2>
                <p className="timeline-desc">
                  Select an administrative feature below to open its dedicated complete page.
                </p>
              </div>
            </div>

            <div className="vertical-actions-grid">
              <div className="vertical-action-card coral-theme" onClick={() => setCurrentView("createCycle")}>
                <div className="action-icon-box coral">➕</div>
                <div className="action-text-box">
                  <div className="action-card-title">Create Academic Cycle</div>
                  <div className="action-card-sub">Open full page to create & activate PBL cycles</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card green-theme" onClick={() => setCurrentView("uploadFaculty")}>
                <div className="action-icon-box green">📂</div>
                <div className="action-text-box">
                  <div className="action-card-title">Upload Faculty</div>
                  <div className="action-card-sub">Open full page to batch import Faculty master CSV</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("uploadStudents")}>
                <div className="action-icon-box blue">📂</div>
                <div className="action-text-box">
                  <div className="action-card-title">Upload Students</div>
                  <div className="action-card-sub">Open full page to batch import Student USNs</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card purple-theme" onClick={() => setCurrentView("viewStudents")}>
                <div className="action-icon-box purple">👨‍🎓</div>
                <div className="action-text-box">
                  <div className="action-card-title">View Students</div>
                  <div className="action-card-sub">Open full directory of 200 student USNs & sections</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card amber-theme" onClick={() => setCurrentView("viewFaculty")}>
                <div className="action-icon-box amber">👨‍🏫</div>
                <div className="action-text-box">
                  <div className="action-card-title">View Faculty</div>
                  <div className="action-card-sub">Open full directory of 20 faculty codes & designations</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card dark-theme" onClick={() => setCurrentView("rules")}>
                <div className="action-icon-box dark">⚙</div>
                <div className="action-text-box">
                  <div className="action-card-title">Configure Team Rules</div>
                  <div className="action-card-sub">Open full page to configure team size regulations</div>
                </div>
                <div className="action-arrow">→</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 2: CREATE ACADEMIC CYCLE FULL PAGE ================= */}
      {currentView === "createCycle" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">➕ Academic Cycles & Timelines Management</h1>
            <p className="full-page-desc">Create new PBL academic cycles, configure start & end dates, and manage active status.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px" }}>
            {/* Form Box */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>Create New Cycle</h2>
              <form onSubmit={handleCreateCycle}>
                <div className="modal-field">
                  <label>Cycle Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026-27 Academic Cycle"
                    value={cycleName}
                    onChange={(e) => setCycleName(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="modal-field" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="set_active"
                    checked={cycleIsActive}
                    onChange={(e) => setCycleIsActive(e.target.checked)}
                    style={{ width: "auto", height: "auto" }}
                  />
                  <label htmlFor="set_active" style={{ marginBottom: 0, cursor: "pointer" }}>Set as Current Active PBL Cycle</label>
                </div>
                <button type="submit" className="btn-primary-pill" style={{ width: "100%", marginTop: "12px" }} disabled={loading}>
                  {loading ? "Creating..." : "Create & Activate Cycle"}
                </button>
              </form>
            </div>

            {/* List Table */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>Existing Academic Cycles ({cycles.length})</h2>
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cycle Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((c) => (
                      <tr key={c.id}>
                        <td>#{c.id}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.start_date ? new Date(c.start_date).toLocaleDateString() : "-"}</td>
                        <td>{c.end_date ? new Date(c.end_date).toLocaleDateString() : "-"}</td>
                        <td>
                          <span className="legend-item" style={{ background: c.is_active ? "#e7f7ef" : "#f0f2f5", color: c.is_active ? "#0f8a5f" : "#65676b" }}>
                            {c.is_active ? "🟢 Active" : "⚪ Inactive"}
                          </span>
                        </td>
                        <td>
                          {c.is_active ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className="legend-item" style={{ background: "#e7f7ef", color: "#0f8a5f", fontWeight: 800 }}>
                                🟢 OPEN & ACTIVE
                              </span>
                              <button
                                className="btn-secondary-pill"
                                style={{ padding: "6px 12px", fontSize: "12px", background: "#ffebe9", color: "#c62828", borderColor: "#ffcdd2" }}
                                onClick={() => handleToggleCycle(c.id, c.is_active)}
                              >
                                🔒 Deactivate
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn-primary-pill"
                              style={{ padding: "6px 14px", fontSize: "12px", background: "var(--airbnb-coral)" }}
                              onClick={() => handleOpenCycle(c.id, c.name)}
                            >
                              🚀 Open Cycle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 3: UPLOAD FACULTY FULL PAGE ================= */}
      {currentView === "uploadFaculty" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">📂 Upload Faculty Master List</h1>
            <p className="full-page-desc">Import CSV/XLSX faculty data to provision accounts and codes automatically.</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "680px", margin: "0 auto" }}>
            <form onSubmit={handleUploadFaculty}>
              <div className="modal-field">
                <label style={{ fontSize: "16px", fontWeight: 800 }}>Choose Faculty Master CSV File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setFacultyFile(e.target.files?.[0] || null)}
                  required
                  style={{ padding: "14px" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", margin: "20px 0" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 800 }}>📋 Required CSV Column Format:</h4>
                <code style={{ display: "block", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                  Faculty_Code, Name, Email, Designation, Department<br />
                  FAC001, Dr. Anand V, anand@gmu.ac.in, Professor, CSE<br />
                  FAC002, Prof. Sneha K, sneha@gmu.ac.in, Assistant Professor, CSE
                </code>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setCurrentView("home")}>Cancel</button>
                <button type="submit" className="btn-primary-pill" disabled={loading}>
                  {loading ? "Uploading & Processing..." : "Upload & Save Faculty Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW 4: UPLOAD STUDENTS FULL PAGE ================= */}
      {currentView === "uploadStudents" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">📂 Upload Student Master List</h1>
            <p className="full-page-desc">Import CSV/XLSX student records with USN format validation (e.g. U24E01CS001).</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "680px", margin: "0 auto" }}>
            <form onSubmit={handleUploadStudent}>
              <div className="modal-field">
                <label style={{ fontSize: "16px", fontWeight: 800 }}>Choose Student Master CSV File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => setStudentFile(e.target.files?.[0] || null)}
                  required
                  style={{ padding: "14px" }}
                />
              </div>

              <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "14px", border: "1px solid #e2e8f0", margin: "20px 0" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: 800 }}>📋 Required CSV Column Format:</h4>
                <code style={{ display: "block", background: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}>
                  USN, Name, Email, Phone<br />
                  U24E01CS001, Aarav Sharma, u24e01cs001@gmu.ac.in, 9876543210<br />
                  U24E01CS002, Ananya Rao, u24e01cs002@gmu.ac.in, 9876543211
                </code>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setCurrentView("home")}>Cancel</button>
                <button type="submit" className="btn-primary-pill" disabled={loading}>
                  {loading ? "Uploading & Processing..." : "Upload & Save Student Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW 5: VIEW STUDENTS FULL PAGE ================= */}
      {currentView === "viewStudents" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">👨‍🎓 Student Master Directory ({students.length} Registered Students)</h1>
            <p className="full-page-desc">Complete database of registered student USNs, assigned section names, and mentor professors.</p>
          </div>

          <div className="airbnb-card">
            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Filter by USN (e.g. U24E01CS001), Student Name, or Section..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap" style={{ maxHeight: "600px" }}>
              <table>
                <thead>
                  <tr>
                    <th>USN</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Section</th>
                    <th>Mentor Faculty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <code>{s.usn}</code>
                      </td>
                      <td>
                        <strong>{s.name}</strong>
                      </td>
                      <td>{s.email || "-"}</td>
                      <td>
                        <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>
                          {s.section_name || "Section 5A"}
                        </span>
                      </td>
                      <td>{s.mentor_name || "Dr. Anand V"}</td>
                      <td>
                        <span className="legend-item" style={{ background: s.is_active ? "#e7f7ef" : "#ffebe9", color: s.is_active ? "#0f8a5f" : "#c62828" }}>
                          {s.is_active ? "Active" : "Disabled"}
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

      {/* ================= VIEW 6: VIEW FACULTY FULL PAGE ================= */}
      {currentView === "viewFaculty" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">👨‍🏫 Faculty Master Directory ({faculties.length} Registered Professors)</h1>
            <p className="full-page-desc">Complete database of registered faculty codes, designations, and department mappings.</p>
          </div>

          <div className="airbnb-card">
            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Filter by Faculty Code (e.g. FAC001), Professor Name, or Department..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap" style={{ maxHeight: "600px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Faculty Code</th>
                    <th>Faculty Name</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <code>{f.faculty_code}</code>
                      </td>
                      <td>
                        <strong>{f.name}</strong>
                      </td>
                      <td>{f.email}</td>
                      <td>{f.designation || "Faculty"}</td>
                      <td>
                        <span className="action-tag" style={{ background: "#f0f2f5", color: "#102a43" }}>
                          {f.department || "CSE"}
                        </span>
                      </td>
                      <td>
                        <span className="legend-item" style={{ background: f.is_active ? "#e7f7ef" : "#ffebe9", color: f.is_active ? "#0f8a5f" : "#c62828" }}>
                          {f.is_active ? "Active" : "Disabled"}
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

      {/* ================= VIEW 7: CONFIGURE RULES FULL PAGE ================= */}
      {currentView === "rules" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">⚙ Configure Team Rules & Platform Regulations</h1>
            <p className="full-page-desc">Set minimum and maximum student team size limits for PBL project proposals.</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <form onSubmit={handleSaveRules}>
              <div className="modal-field">
                <label>Minimum Team Size (Students per Team)</label>
                <input
                  type="number"
                  min="1"
                  value={teamMin}
                  onChange={(e) => setTeamMin(Number(e.target.value))}
                  required
                />
              </div>
              <div className="modal-field">
                <label>Maximum Team Size (Students per Team)</label>
                <input
                  type="number"
                  min="1"
                  value={teamMax}
                  onChange={(e) => setTeamMax(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                <button type="button" className="btn-secondary-pill" onClick={() => setCurrentView("home")}>Cancel</button>
                <button type="submit" className="btn-primary-pill" disabled={loading}>
                  {loading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
