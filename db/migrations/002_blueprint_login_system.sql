-- Blueprint ER Diagram migration for Falcon PBL Project Hub

CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  program_id INT REFERENCES programs(id) ON DELETE CASCADE,
  semester_no INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(program_id, semester_no)
);

CREATE TABLE IF NOT EXISTS faculty_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS faculty_role_mapping (
  id SERIAL PRIMARY KEY,
  faculty_id INT REFERENCES faculty(id) ON DELETE CASCADE,
  role_id INT REFERENCES faculty_roles(id) ON DELETE CASCADE,
  UNIQUE(faculty_id, role_id)
);

CREATE TABLE IF NOT EXISTS student_history (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  changed_by INT REFERENCES users(id),
  change_type VARCHAR(100) NOT NULL,
  change_details TEXT,
  changed_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_history (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  changed_by INT REFERENCES users(id),
  change_type VARCHAR(100) NOT NULL,
  change_details TEXT,
  changed_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_technology (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  technology VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS project_files (
  id SERIAL PRIMARY KEY,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  uploaded_on TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by INT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS application_actions (
  id SERIAL PRIMARY KEY,
  application_id INT REFERENCES project_applications(id) ON DELETE CASCADE,
  action_by INT REFERENCES faculty(id),
  action_type VARCHAR(50) NOT NULL,
  remarks TEXT,
  action_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposal_actions (
  id SERIAL PRIMARY KEY,
  proposal_id INT REFERENCES student_project_proposals(id) ON DELETE CASCADE,
  action_by INT REFERENCES faculty(id),
  action_type VARCHAR(50) NOT NULL,
  remarks TEXT,
  action_on TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_on TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure user role enum supports COORDINATOR
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK(role IN ('ADMIN','COORDINATOR','FACULTY','SUPERVISOR','STUDENT'));
