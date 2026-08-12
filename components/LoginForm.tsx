"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  initialError?: string;
}

type RoleTab = "STUDENT" | "FACULTY" | "COORDINATOR" | "MENTOR" | "ADMIN";

export function LoginForm({ initialError }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState<RoleTab>("STUDENT");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    initialError ? "Invalid credentials. Please verify your Code/USN and password." : ""
  );
  const router = useRouter();

  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("identifier", identifier);
    formData.append("password", password);
    formData.append("role_type", activeTab);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });

      if (res.redirected) {
        if (res.url.includes("error=1")) {
          setError(
            activeTab === "STUDENT"
              ? "Invalid USN or password. Valid USNs: U24E01CS001 to U24E01CS200."
              : activeTab === "FACULTY"
              ? "Invalid Faculty Code or password. Valid Codes: FAC001 to FAC020."
              : activeTab === "COORDINATOR"
              ? "Invalid Coordinator Code or password. Valid Codes: FAC001 to FAC020."
              : activeTab === "MENTOR"
              ? "Invalid Faculty Mentor Code or password. Valid Codes: FAC001 to FAC020."
              : "Invalid Admin Code or password. Valid Code: ADM001."
          );
          setLoading(false);
        } else {
          router.push(res.url);
          router.refresh();
        }
      } else if (!res.ok) {
        setError("Login failed. Please verify credentials.");
        setLoading(false);
      } else {
        const dest =
          activeTab === "STUDENT"
            ? "/dashboard"
            : activeTab === "FACULTY"
            ? "/faculty"
            : activeTab === "COORDINATOR"
            ? "/coordinator"
            : activeTab === "MENTOR"
            ? "/mentor"
            : "/admin";
        router.push(dest);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fb-insta-login-container">
      {/* Left side: Institutional Showcase */}
      <div className="login-showcase">
        <div className="brand-badge-pill">
          <span className="dot-pulse"></span> GM University • Dept of CSE
        </div>
        <h1 className="showcase-title">
          Falcon <span className="gradient-text">PBL Hub</span>
        </h1>
        <p className="showcase-desc">
          Project-Based Learning Portal for GM University CSE Students (200 USNs), Faculty (20 Codes), Coordinators & Admin.
        </p>

        <div className="showcase-features">
          <div className="feature-item">
            <div className="feature-icon">🎓</div>
            <div>
              <strong>200 Separate Student Accounts</strong>
              <span>USNs: <code>U24E01CS001</code> to <code>U24E01CS200</code></span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👨‍🏫</div>
            <div>
              <strong>20 Separate Faculty Accounts</strong>
              <span>Faculty Codes: <code>FAC001</code> to <code>FAC020</code></span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📋</div>
            <div>
              <strong>PBL Coordinator Dashboard</strong>
              <span>Supervisor Mapping, Rubrics Creator & Audit Logs</span>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👑</div>
            <div>
              <strong>1 Admin Account</strong>
              <span>Admin Code: <code>ADM001</code> / <code>admin</code></span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Role-Based Instagram/Facebook Login Card */}
      <div className="login-card-wrapper">
        <div className="insta-card">
          <div className="card-header">
            <div className="insta-logo">Falcon PBL</div>
            <p className="insta-subtitle">Log in with your USN, Faculty, or Coordinator Code</p>
          </div>

          {/* Role Navigation Tabs */}
          <div className="role-tabs-header">
            <button
              type="button"
              className={`role-tab-btn ${activeTab === "STUDENT" ? "active" : ""}`}
              onClick={() => handleTabChange("STUDENT")}
            >
              🎓 Student
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeTab === "FACULTY" ? "active" : ""}`}
              onClick={() => handleTabChange("FACULTY")}
            >
              👨‍🏫 Faculty
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeTab === "COORDINATOR" ? "active" : ""}`}
              onClick={() => handleTabChange("COORDINATOR")}
            >
              📋 Coordinator
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeTab === "MENTOR" ? "active" : ""}`}
              onClick={() => handleTabChange("MENTOR")}
            >
              👨‍🏫 Faculty Mentor
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeTab === "ADMIN" ? "active" : ""}`}
              onClick={() => handleTabChange("ADMIN")}
            >
              👑 Admin
            </button>
          </div>

          {error && <div className="fb-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="insta-form">
            <div className="input-group">
              <input
                id="identifier-input"
                type="text"
                name="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder=" "
                required
                className="insta-input"
                autoComplete="username"
              />
              <label htmlFor="identifier-input" className="insta-label">
                {activeTab === "STUDENT"
                  ? "Enter USN (U24E01CS001 - U24E01CS200)"
                  : activeTab === "FACULTY"
                  ? "Enter Faculty Code (FAC001 - FAC020)"
                  : activeTab === "COORDINATOR"
                  ? "Enter Coordinator Code (FAC001 - FAC020)"
                  : "Enter Admin Code (ADM001)"}
              </label>
            </div>

            <div className="input-group">
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                className="insta-input"
                autoComplete="current-password"
              />
              <label htmlFor="password-input" className="insta-label">
                Password
              </label>
              {password.length > 0 && (
                <button
                  type="button"
                  className="show-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              )}
            </div>

            <button type="submit" className="fb-login-btn" disabled={loading}>
              {loading ? (
                <span className="btn-spinner">Logging in...</span>
              ) : activeTab === "STUDENT" ? (
                "Student Log In"
              ) : activeTab === "FACULTY" ? (
                "Faculty Log In"
              ) : activeTab === "COORDINATOR" ? (
                "Coordinator Log In"
              ) : (
                "Admin Log In"
              )}
            </button>
          </form>
        </div>

        <div className="insta-footer-box">
          <span>Institutional Login • GM University Davanagere</span>
        </div>
      </div>
    </div>
  );
}
