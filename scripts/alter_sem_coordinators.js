const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:nikhil@localhost:5433/falcon_pbl",
});

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS semester_coordinators (
      id SERIAL PRIMARY KEY,
      semester INT NOT NULL UNIQUE CHECK(semester >= 1 AND semester <= 8),
      coordinator_faculty_id INT REFERENCES faculty(id),
      mentor_faculty_id INT REFERENCES faculty(id),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add column if missing from earlier migration
  await pool.query(`
    ALTER TABLE semester_coordinators ADD COLUMN IF NOT EXISTS mentor_faculty_id INT REFERENCES faculty(id);
  `);

  console.log("Updated semester_coordinators table schema!");

  const facultyRows = await pool.query("SELECT id FROM faculty ORDER BY id ASC LIMIT 5");
  const facIds = facultyRows.rows.map((r) => r.id);

  if (facIds.length > 0) {
    for (let sem = 1; sem <= 8; sem++) {
      const coordId = facIds[(sem - 1) % facIds.length];
      const mentorId = facIds[sem % facIds.length];

      await pool.query(
        `INSERT INTO semester_coordinators (semester, coordinator_faculty_id, mentor_faculty_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (semester) DO UPDATE SET 
           coordinator_faculty_id = EXCLUDED.coordinator_faculty_id,
           mentor_faculty_id = EXCLUDED.mentor_faculty_id`,
        [sem, coordId, mentorId]
      );
    }
    console.log("Seeded 1 Semester Coordinator & 1 Faculty Mentor for 1st-8th Semesters!");
  }

  await pool.end();
}

main().catch(console.error);
