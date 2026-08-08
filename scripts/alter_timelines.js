const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:nikhil@localhost:5433/falcon_pbl",
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pbl_timelines (
      id SERIAL PRIMARY KEY,
      feature_key VARCHAR(100) UNIQUE NOT NULL,
      feature_title VARCHAR(150) NOT NULL,
      description TEXT,
      start_time TIMESTAMPTZ,
      end_time TIMESTAMPTZ,
      is_enabled BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("Created pbl_timelines table successfully!");

  const defaultTimelines = [
    {
      feature_key: "team_formation",
      feature_title: "Student Team Formation & Registration",
      description: "Controls when students can form teams, add members, and choose team leaders.",
      start_time: "2026-08-01T09:00:00.000Z",
      end_time: "2026-08-15T23:59:00.000Z",
      is_enabled: true,
    },
    {
      feature_key: "faculty_project_proposals",
      feature_title: "Faculty Project Proposals & Publishing",
      description: "Controls when faculty members can create and publish new PBL project ideas.",
      start_time: "2026-08-05T09:00:00.000Z",
      end_time: "2026-08-20T23:59:00.000Z",
      is_enabled: true,
    },
    {
      feature_key: "student_project_selection",
      feature_title: "Student Project Choice Selection",
      description: "Controls when student teams can submit their top project choices.",
      start_time: "2026-08-16T09:00:00.000Z",
      end_time: "2026-08-30T23:59:00.000Z",
      is_enabled: true,
    },
    {
      feature_key: "faculty_mark_submission",
      feature_title: "Faculty Mark Submission & Evaluation",
      description: "Controls when supervisors & guides can evaluate student teams and enter marks for Review 1, 2, and 3.",
      start_time: "2026-09-01T09:00:00.000Z",
      end_time: "2026-10-15T23:59:00.000Z",
      is_enabled: true,
    },
  ];

  for (const t of defaultTimelines) {
    await pool.query(
      `INSERT INTO pbl_timelines (feature_key, feature_title, description, start_time, end_time, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (feature_key) 
       DO UPDATE SET feature_title=EXCLUDED.feature_title, description=EXCLUDED.description`,
      [t.feature_key, t.feature_title, t.description, t.start_time, t.end_time, t.is_enabled]
    );
  }

  console.log("Seeded default PBL timelines!");
  await pool.end();
}

main().catch(console.error);
