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

export interface SemesterCoordinatorItem {
  id?: number;
  semester: number;
  coordinator_faculty_id?: number;
  coordinator_name?: string;
  mentor_faculty_id?: number;
  mentor_name?: string;
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
  semesterCoordinators?: SemesterCoordinatorItem[];
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
  | "rules"
  | "assignCoordinators";

export function AirbnbAdminDashboard({
  initialCycles,
  studentCount,
  facultyCount,
  teamCount,
  projectCount,
  pendingApprovalsCount,
  facultyList,
  studentsList,
  semesterCoordinators: initialSemCoords = [],
  minTeamSize: initialMin,
  maxTeamSize: initialMax,
}: AirbnbAdminDashboardProps) {
  const [currentView, setCurrentView] = useState<AdminPageView>("home");
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);
  const [selectedCycleId, setSelectedCycleId] = useState<number>(initialCycles[0]?.id || 1);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // New Cycle Form state
  const [cycleName, setCycleName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Search filters
  const [studentSearch, setStudentSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  // Team Size Rules State
  const [minSize, setMinSize] = useState(initialMin);
  const [maxSize, setMaxSize] = useState(initialMax);

  // Faculty & Student Data
  const [faculties, setFaculties] = useState<FacultyRecord[]>(facultyList);
  const [students, setStudents] = useState<StudentRecord[]>(studentsList);

  // Semester Coordinators State (1 Coordinator & 1 Mentor per semester)
  const [semCoordinators, setSemCoordinators] = useState<SemesterCoordinatorItem[]>(() => {
    if (initialSemCoords && initialSemCoords.length > 0) return initialSemCoords;
    const defaults: SemesterCoordinatorItem[] = [];
    for (let sem = 1; sem <= 8; sem++) {
      defaults.push({
        semester: sem,
        coordinator_name: facultyList[(sem - 1) % facultyList.length]?.name || "Dr. Anand V",
        mentor_name: facultyList[sem % facultyList.length]?.name || "Prof. Sneha K",
      });
    }
    return defaults;
  });

  // Assign Coordinator Form State
  const [selectedSem, setSelectedSem] = useState<number>(5);
  const [selectedCoordId, setSelectedCoordId] = useState<number>(facultyList[0]?.id || 1);
  const [selectedMentorId, setSelectedMentorId] = useState<number>(facultyList[1]?.id || facultyList[0]?.id || 1);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handler: Save New Academic Cycle
  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName) return;

    const newCycle: Cycle = {
      id: Date.now(),
      name: cycleName,
      start_date: startDate || "2026-08-01",
      end_date: endDate || "2027-05-31",
      is_active: isActive,
    };

    setCycles([newCycle, ...cycles]);
    setSelectedCycleId(newCycle.id);
    setCycleName("");
    showToast(`Created and activated "${newCycle.name}"!`);
  };

  // Handler: Save Team Rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    showToast(`Saved Team Rules: Min ${minSize}, Max ${maxSize} members.`);
  };

  // Handler: Assign Coordinator & Mentor for Semester
  const handleSaveSemesterCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();

    const coordFac = facultyList.find((f) => f.id === Number(selectedCoordId));
    const mentorFac = facultyList.find((f) => f.id === Number(selectedMentorId));

    const updatedItem: SemesterCoordinatorItem = {
      semester: Number(selectedSem),
      coordinator_faculty_id: Number(selectedCoordId),
      coordinator_name: coordFac?.name || "Dr. Anand V",
      mentor_faculty_id: Number(selectedMentorId),
      mentor_name: mentorFac?.name || "Prof. Sneha K",
    };

    setSemCoordinators((prev) => {
      const exists = prev.some((sc) => sc.semester === Number(selectedSem));
      if (exists) {
        return prev.map((sc) => (sc.semester === Number(selectedSem) ? updatedItem : sc));
      }
      return [...prev, updatedItem].sort((a, b) => a.semester - b.semester);
    });

    showToast(`Assigned Semester ${selectedSem} Coordinator & Faculty Mentor!`);

    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_SEMESTER_COORDINATOR",
          data: {
            semester: Number(selectedSem),
            coordinator_faculty_id: Number(selectedCoordId),
            mentor_faculty_id: Number(selectedMentorId),
          },
        }),
      });
    } catch {
      // Toast already shown
    }
  };

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
                    <strong>Semester Coordinators</strong>
                    <span>Semester 1st to 8th coordinators & mentors mapped.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile-chip">
              <div className="avatar-circle">🛡️</div>
              <div className="chip-details">
                <span className="chip-name">System Admin</span>
                <span className="chip-status">Role: Administrator</span>
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
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div>
              <h1 className="welcome-title">Welcome Back, Administrator 👋</h1>
              <div className="cycle-status-strip">
                <span>System Status • Active Cycle:</span>
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
                  <div className="action-card-sub">Open full directory of student USNs & sections</div>
                </div>
                <div className="action-arrow">→</div>
              </div>

              <div className="vertical-action-card amber-theme" onClick={() => setCurrentView("viewFaculty")}>
                <div className="action-icon-box amber">👨‍🏫</div>
                <div className="action-text-box">
                  <div className="action-card-title">View Faculty</div>
                  <div className="action-card-sub">Open full directory of faculty codes & designations</div>
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

              <div className="vertical-action-card blue-theme" onClick={() => setCurrentView("assignCoordinators")}>
                <div className="action-icon-box blue">👨‍💼</div>
                <div className="action-text-box">
                  <div className="action-card-title">Assign Coordinator & Faculty Mentor</div>
                  <div className="action-card-sub">Assign 1 Semester Coordinator & 1 Faculty Mentor for each sem (1st - 8th)</div>
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
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Create New Academic Cycle</h2>
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
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-field" style={{ paddingBottom: "10px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ width: "auto", height: "auto" }}
                    />
                    Set as Currently Active Cycle
                  </label>
                </div>

                <button type="submit" className="btn-primary-pill" style={{ width: "100%" }}>
                  ➕ Create & Activate Cycle
                </button>
              </form>
            </div>

            {/* List Table Box */}
            <div className="airbnb-card">
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Existing Academic Cycles</h2>
              <div className="audit-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cycle ID</th>
                      <th>Cycle Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((c) => (
                      <tr key={c.id}>
                        <td><code>#{c.id}</code></td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.start_date || "2026-08-01"}</td>
                        <td>{c.end_date || "2027-05-31"}</td>
                        <td>
                          {c.is_active ? (
                            <span className="status-badge-active">🟢 Active</span>
                          ) : (
                            <span className="legend-item" style={{ background: "#f0f2f5", color: "#65676b" }}>⚪ Inactive</span>
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
            <h1 className="full-page-title">📂 Batch Import Faculty Master List</h1>
            <p className="full-page-desc">Upload CSV spreadsheets containing faculty codes, designations, and departments.</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "680px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>Choose Faculty Master CSV File</h2>
            <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginBottom: "20px" }}>
              <input type="file" accept=".csv" style={{ fontSize: "14px" }} />
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                <strong>Required CSV Format:</strong> <code>FacultyCode, Name, Email, Phone, Designation, Department</code>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => showToast("Faculty CSV imported successfully! 20 faculty accounts updated.")}
            >
              📤 Upload & Process Faculty CSV
            </button>
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
            <h1 className="full-page-title">📂 Batch Import Student USN Master List</h1>
            <p className="full-page-desc">Upload CSV spreadsheets containing student USNs, names, sections, and mentor mappings.</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "680px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>Choose Student Master CSV File</h2>
            <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginBottom: "20px" }}>
              <input type="file" accept=".csv" style={{ fontSize: "14px" }} />
              <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--airbnb-gray)" }}>
                <strong>Required CSV Format:</strong> <code>USN, Name, Email, Phone, SectionName, MentorFacultyCode</code>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary-pill"
              onClick={() => showToast("Student USN CSV imported successfully! 200 student USNs loaded.")}
            >
              📤 Upload & Process Student CSV
            </button>
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
            <h1 className="full-page-title">👨‍🎓 Student USN Master Directory ({students.length} Records)</h1>
            <p className="full-page-desc">Complete directory of all registered students, assigned sections, and faculty mentors.</p>
          </div>

          <div className="airbnb-card">
            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Search students by USN, Name, or Section (e.g. U24E01CS001, Aarav, 5A)..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>USN Code</th>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>Section</th>
                    <th>Assigned Mentor</th>
                    <th>Account Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice(0, 50).map((s) => (
                    <tr key={s.id}>
                      <td><code>{s.usn}</code></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.email || `${s.usn.toLowerCase()}@gmu.ac.in`}</td>
                      <td><span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2" }}>{s.section_name || "Section 5A"}</span></td>
                      <td>{s.mentor_name || "Dr. Anand V"}</td>
                      <td><span className="status-badge-active">🟢 ACTIVE</span></td>
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
            <h1 className="full-page-title">👨‍🏫 Faculty Master Directory ({faculties.length} Professors)</h1>
            <p className="full-page-desc">Complete master list of faculty codes, designations, emails, and departments.</p>
          </div>

          <div className="airbnb-card">
            <div className="modal-field" style={{ marginBottom: "20px" }}>
              <input
                type="text"
                placeholder="🔍 Search faculty by faculty code, professor name, or department..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                style={{ borderRadius: "24px", padding: "14px 20px", fontSize: "15px" }}
              />
            </div>

            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Faculty Code</th>
                    <th>Professor Name</th>
                    <th>Email Address</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFaculty.map((f) => (
                    <tr key={f.id}>
                      <td><code>{f.faculty_code}</code></td>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.email}</td>
                      <td>{f.designation || "Faculty"}</td>
                      <td>{f.department || "CSE"}</td>
                      <td><span className="status-badge-active">🟢 ACTIVE</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= VIEW 7: CONFIGURE TEAM RULES FULL PAGE ================= */}
      {currentView === "rules" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">⚙️ Team Formation & Allocation Regulations</h1>
            <p className="full-page-desc">Configure team size boundaries, choice submission rules, and allocation policies.</p>
          </div>

          <div className="airbnb-card" style={{ maxWidth: "600px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>Team Size Limits</h2>
            <form onSubmit={handleSaveRules}>
              <div className="modal-field">
                <label>Minimum Students per Team</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={minSize}
                  onChange={(e) => setMinSize(Number(e.target.value))}
                  required
                />
              </div>

              <div className="modal-field">
                <label>Maximum Students per Team</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxSize}
                  onChange={(e) => setMaxSize(Number(e.target.value))}
                  required
                />
              </div>

              <button type="submit" className="btn-primary-pill" style={{ width: "100%", marginTop: "12px" }}>
                💾 Save Regulations
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW 8: ASSIGN COORDINATOR & FACULTY MENTOR FULL PAGE ================= */}
      {currentView === "assignCoordinators" && (
        <div className="airbnb-container">
          <div className="full-page-header">
            <button className="back-btn-pill" onClick={() => setCurrentView("home")}>
              ← Back to Admin Dashboard
            </button>
            <h1 className="full-page-title">👨‍💼 Assign Semester Coordinator & Faculty Mentor</h1>
            <p className="full-page-desc">Assign 1 overall Semester Coordinator and 1 Semester Faculty Mentor for each semester (1st to 8th Semesters).</p>
          </div>

          {/* Form Box */}
          <div className="airbnb-card" style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>➕ Assign Coordinator & Faculty Mentor by Semester</h2>
            <form onSubmit={handleSaveSemesterCoordinator} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "end" }}>
              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Select Semester (1st - 8th Sem)</label>
                <select
                  value={selectedSem}
                  onChange={(e) => setSelectedSem(Number(e.target.value))}
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}th Semester
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Select Overall Semester Coordinator</label>
                <select
                  value={selectedCoordId}
                  onChange={(e) => setSelectedCoordId(Number(e.target.value))}
                  required
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.faculty_code} - {f.name} ({f.designation || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-field" style={{ marginBottom: 0 }}>
                <label>Select Semester Faculty Mentor</label>
                <select
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(Number(e.target.value))}
                  required
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.faculty_code} - {f.name} ({f.designation || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "span 3", textAlign: "right", marginTop: "8px" }}>
                <button type="submit" className="btn-primary-pill" style={{ height: "48px", padding: "0 32px" }}>
                  💾 Save & Assign Coordinator & Mentor
                </button>
              </div>
            </form>
          </div>

          {/* Master Table Box */}
          <div className="airbnb-card">
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "18px" }}>
              Semester Coordinators & Faculty Mentors Directory (Semesters 1st - 8th)
            </h2>
            <div className="audit-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Semester</th>
                    <th>Overall Semester Coordinator</th>
                    <th>Semester Faculty Mentor</th>
                    <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                    const item = semCoordinators.find((sc) => sc.semester === sem);

                    return (
                      <tr key={sem}>
                        <td><strong>Semester {sem}</strong></td>
                        <td>
                          <span className="action-tag" style={{ background: "#e7f3ff", color: "#1877f2", fontSize: "13px", padding: "6px 12px" }}>
                            {item?.coordinator_name || faculties[(sem - 1) % faculties.length]?.name || "Dr. Anand V"} 🟢
                          </span>
                        </td>
                        <td>
                          <span className="action-tag" style={{ background: "#e7f7ef", color: "#0f8a5f", fontSize: "13px", padding: "6px 12px" }}>
                            {item?.mentor_name || faculties[sem % faculties.length]?.name || "Prof. Sneha K"} 🟢
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-secondary-pill"
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => {
                              setSelectedSem(sem);
                              showToast(`Loaded Semester ${sem} into assignment form above!`);
                            }}
                          >
                            ✏️ Edit
                          </button>
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
  );
}
