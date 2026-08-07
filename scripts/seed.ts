import bcrypt from "bcryptjs";
import { pool } from "../lib/db";

async function main() {
  console.log("Seeding database with 200 Students, 20 Faculties, and 1 Admin...");
  const passwordHash = await bcrypt.hash("Falcon@123", 12);

  // 1. Academic Cycle
  await pool.query(`
    INSERT INTO academic_cycles (name, start_date, end_date, is_active)
    VALUES ('2026-27 Academic Cycle', '2026-07-01', '2027-06-30', true)
    ON CONFLICT (name) DO NOTHING;
  `);

  const cycleId = (
    await pool.query("SELECT id FROM academic_cycles WHERE name='2026-27 Academic Cycle'")
  ).rows[0].id;

  // 2. Program
  await pool.query(`
    INSERT INTO programs (code, name)
    VALUES ('CSE', 'Computer Science and Engineering')
    ON CONFLICT (code) DO NOTHING;
  `);

  const cseProgramId = (await pool.query("SELECT id FROM programs WHERE code='CSE'")).rows[0].id;

  // 3. Semesters & Sections
  await pool.query(
    `
    INSERT INTO semesters (program_id, semester_no, name)
    VALUES 
      ($1, 5, 'Semester V'),
      ($1, 6, 'Semester VI')
    ON CONFLICT (program_id, semester_no) DO NOTHING;
  `,
    [cseProgramId]
  );

  await pool.query(`
    INSERT INTO sections (program_id, semester, name)
    VALUES 
      (${cseProgramId}, 5, '5A'),
      (${cseProgramId}, 5, '5B'),
      (${cseProgramId}, 5, '5C'),
      (${cseProgramId}, 5, '5D')
    ON CONFLICT (program_id, semester, name) DO NOTHING;
  `);

  const section5A = (
    await pool.query(`SELECT id FROM sections WHERE program_id=$1 AND semester=5 AND name='5A'`, [
      cseProgramId,
    ])
  ).rows[0].id;
  const section5B = (
    await pool.query(`SELECT id FROM sections WHERE program_id=$1 AND semester=5 AND name='5B'`, [
      cseProgramId,
    ])
  ).rows[0].id;
  const section5C = (
    await pool.query(`SELECT id FROM sections WHERE program_id=$1 AND semester=5 AND name='5C'`, [
      cseProgramId,
    ])
  ).rows[0].id;
  const section5D = (
    await pool.query(`SELECT id FROM sections WHERE program_id=$1 AND semester=5 AND name='5D'`, [
      cseProgramId,
    ])
  ).rows[0].id;

  const sections = [section5A, section5B, section5C, section5D];

  // 4. Admin Account (ADM001)
  await pool.query(`
    INSERT INTO faculty (faculty_code, name, email, designation, department)
    VALUES ('ADM001', 'System Administrator', 'admin@gmu.ac.in', 'System Administrator', 'CSE')
    ON CONFLICT (faculty_code) DO UPDATE SET name=EXCLUDED.name;
  `);

  const adminFacId = (await pool.query("SELECT id FROM faculty WHERE faculty_code='ADM001'")).rows[0].id;

  await pool.query(
    `
    INSERT INTO users (username, password_hash, display_name, role, faculty_id)
    VALUES ('ADM001', $1, 'System Administrator', 'ADMIN', $2),
           ('admin', $1, 'System Administrator', 'ADMIN', $2)
    ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, faculty_id=EXCLUDED.faculty_id;
  `,
    [passwordHash, adminFacId]
  );

  // 5. Generate 20 Separate Faculties (FAC001 to FAC020)
  console.log("Generating 20 Faculty accounts...");
  const facultyNames = [
    "Dr. Anand V", "Dr. Sunita M", "Prof. Ramesh Chandra", "Dr. Kavita Sharma", "Prof. Deepak Verma",
    "Dr. Rajesh Kumar", "Prof. Meera K", "Dr. Suresh Babu", "Prof. Anitha R", "Dr. Praveen Naidu",
    "Prof. Swati Deshmukh", "Dr. Manoj Hegde", "Prof. Divya K", "Dr. Arun Kumar", "Prof. Pooja Rani",
    "Dr. Vikram Singh", "Prof. Neha Gupta", "Dr. Santosh Patil", "Prof. Archana S", "Dr. Mahesh Gowda"
  ];

  for (let i = 1; i <= 20; i++) {
    const padNum = String(i).padStart(3, "0");
    const code = `FAC${padNum}`;
    const name = facultyNames[i - 1] || `Faculty ${code}`;
    const email = `faculty${padNum}@gmu.ac.in`;
    const designation = i <= 5 ? "Professor & Guide" : i <= 12 ? "Associate Professor" : "Assistant Professor";

    await pool.query(
      `
      INSERT INTO faculty (faculty_code, name, email, designation, department)
      VALUES ($1, $2, $3, $4, 'CSE')
      ON CONFLICT (faculty_code) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, designation=EXCLUDED.designation;
    `,
      [code, name, email, designation]
    );

    const facId = (await pool.query("SELECT id FROM faculty WHERE faculty_code=$1", [code])).rows[0].id;

    // Create separate user account for each faculty code
    await pool.query(
      `
      INSERT INTO users (username, password_hash, display_name, role, faculty_id)
      VALUES ($1, $2, $3, 'FACULTY', $4)
      ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, display_name=EXCLUDED.display_name, faculty_id=EXCLUDED.faculty_id;
    `,
      [code, passwordHash, `${name} (${code})`, facId]
    );
  }

  // Get Faculty 001 for mentorship mapping
  const fac1Id = (await pool.query("SELECT id FROM faculty WHERE faculty_code='FAC001'")).rows[0].id;
  const fac2Id = (await pool.query("SELECT id FROM faculty WHERE faculty_code='FAC002'")).rows[0].id;

  // 6. Generate 200 Separate Students (U24E01CS001 to U24E01CS200)
  console.log("Generating 200 Student accounts (U24E01CS001 to U24E01CS200)...");
  
  for (let i = 1; i <= 200; i++) {
    const padNum = String(i).padStart(3, "0");
    const usn = `U24E01CS${padNum}`;
    const studentName = `Student ${padNum}`;
    const email = `student${padNum}@gmu.ac.in`;
    const assignedSection = sections[(i - 1) % sections.length];

    await pool.query(
      `
      INSERT INTO students (usn, name, email, section_id, mentor_faculty_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (usn) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email;
    `,
      [usn, studentName, email, assignedSection, fac1Id]
    );

    const stuId = (await pool.query("SELECT id FROM students WHERE usn=$1", [usn])).rows[0].id;

    // Create separate user account for each USN
    await pool.query(
      `
      INSERT INTO users (username, password_hash, display_name, role, student_id)
      VALUES ($1, $2, $3, 'STUDENT', $4)
      ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, display_name=EXCLUDED.display_name, student_id=EXCLUDED.student_id;
    `,
      [usn, passwordHash, `${studentName} (${usn})`, stuId]
    );
  }

  // 7. Projects
  await pool.query(
    `
    INSERT INTO projects (title, short_description, description, domain, technology_stack, suitable_semester, max_teams, published_by)
    VALUES 
      ('Smart Campus Energy Monitoring', 'Monitor and optimise energy use across campus buildings.', 'Develop an IoT-based platform that collects sensor data, visualises usage and identifies opportunities for energy conservation.', 'IoT', 'ESP32, MQTT, Next.js, PostgreSQL', 'Semester V', 2, $1),
      ('AI Student Support Assistant', 'Institutional assistant for student FAQs and academic guidance.', 'Build a retrieval-based assistant using approved university content with administrative controls and usage analytics.', 'Artificial Intelligence', 'Python, FastAPI, Next.js, PostgreSQL', 'Semester V', 1, $1),
      ('PBL Team Formation & Allocation Portal', 'Automated project & supervisor allocation system for universities.', 'Comprehensive portal for faculty project publishing, supervisor assignment, and student team proposals.', 'Web Engineering', 'Next.js, PostgreSQL, TypeScript, Node.js', 'Semester V', 3, $2)
    ON CONFLICT DO NOTHING;
  `,
    [fac1Id, fac2Id]
  );

  // 8. Rubrics & Criteria (as per Coordinator Rubrics Flow in Image)
  await pool.query(`
    INSERT INTO rubrics (name, cycle_id, description, is_active)
    VALUES ('Standard PBL Evaluation Rubric', $1, 'Rubric template with 8 predefined evaluation criteria for Semester V projects.', true)
    ON CONFLICT (name) DO NOTHING;
  `, [cycleId]);

  const rubricRows = await pool.query("SELECT id FROM rubrics WHERE name='Standard PBL Evaluation Rubric'");
  if (rubricRows.rows.length > 0) {
    const rubricId = rubricRows.rows[0].id;
    const criteriaList = [
      { name: "Problem Identification", weightage: 10, max_marks: 10 },
      { name: "Literature Survey", weightage: 10, max_marks: 10 },
      { name: "Innovation & Creativity", weightage: 15, max_marks: 15 },
      { name: "Design / Methodology", weightage: 15, max_marks: 15 },
      { name: "Implementation", weightage: 20, max_marks: 20 },
      { name: "Testing & Results", weightage: 10, max_marks: 10 },
      { name: "Documentation", weightage: 10, max_marks: 10 },
      { name: "Presentation & Demo / Viva-Voce", weightage: 10, max_marks: 10 }
    ];

    for (const c of criteriaList) {
      await pool.query(`
        INSERT INTO rubric_criteria (rubric_id, name, weightage, max_marks)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `, [rubricId, c.name, c.weightage, c.max_marks]);
    }
  }

  const totalUsers = (await pool.query("SELECT COUNT(*) FROM users")).rows[0].count;
  const totalStudents = (await pool.query("SELECT COUNT(*) FROM students")).rows[0].count;
  const totalFaculty = (await pool.query("SELECT COUNT(*) FROM faculty")).rows[0].count;

  console.log("-------------------------------------------------------");
  console.log("Seeding Complete!");
  console.log(`Total System Users: ${totalUsers}`);
  console.log(`Total Students: ${totalStudents} (USN: U24E01CS001 to U24E01CS200)`);
  console.log(`Total Faculties: ${totalFaculty} (Codes: FAC001 to FAC020 + ADM001)`);
  console.log("Demo Password for ALL accounts: Falcon@123");
  console.log("-------------------------------------------------------");

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
