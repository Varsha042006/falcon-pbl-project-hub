-- Database migration to support Rubrics and Evaluations (Coordinator Dashboard)

CREATE TABLE IF NOT EXISTS rubrics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  cycle_id INT REFERENCES academic_cycles(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rubric_criteria (
  id SERIAL PRIMARY KEY,
  rubric_id INT REFERENCES rubrics(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  weightage INT NOT NULL CHECK(weightage >= 0 AND weightage <= 100),
  max_marks INT NOT NULL CHECK(max_marks > 0),
  description TEXT
);

CREATE TABLE IF NOT EXISTS team_evaluations (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  rubric_id INT REFERENCES rubrics(id) ON DELETE CASCADE,
  evaluated_by INT REFERENCES faculty(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, MENTOR_APPROVED, HOD_APPROVED
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_marks (
  id SERIAL PRIMARY KEY,
  evaluation_id INT REFERENCES team_evaluations(id) ON DELETE CASCADE,
  criteria_id INT REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(5,2) NOT NULL CHECK(marks_obtained >= 0),
  remarks TEXT,
  UNIQUE(evaluation_id, criteria_id, student_id)
);

CREATE TABLE IF NOT EXISTS evaluation_approvals (
  id SERIAL PRIMARY KEY,
  evaluation_id INT REFERENCES team_evaluations(id) ON DELETE CASCADE,
  action_by INT REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- APPROVE, REJECT, REQUEST_CORRECTION
  remarks TEXT,
  action_on TIMESTAMPTZ DEFAULT NOW()
);
