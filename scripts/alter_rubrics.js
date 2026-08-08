const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:nikhil@localhost:5433/falcon_pbl",
});

async function main() {
  await pool.query(`
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS co_code VARCHAR(20) DEFAULT 'CO5';
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS level5_desc TEXT;
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS level4_desc TEXT;
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS level3_desc TEXT;
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS level2_desc TEXT;
    ALTER TABLE rubric_criteria ADD COLUMN IF NOT EXISTS level1_desc TEXT;
  `);

  console.log("Altered rubric_criteria table with Bloom Taxonomy levels successfully!");

  const rubricRes = await pool.query("SELECT id FROM rubrics ORDER BY id ASC LIMIT 1");
  let rubricId = rubricRes.rows[0]?.id;

  if (!rubricId) {
    const newRubric = await pool.query(
      "INSERT INTO rubrics (name, description) VALUES ('PROJECT-BASED LEARNING (PBL) ASSESSMENT – Review 3', 'Official GM University Review 3 Rubric (20 Marks)') RETURNING id"
    );
    rubricId = newRubric.rows[0].id;
  }

  const officialCriteria = [
    {
      co_code: "CO5",
      name: "Testing & Validation",
      max_marks: 5,
      weightage: 25,
      level5_desc: "Executes exceptional testing with complete and accurate validation (5M)",
      level4_desc: "Performs thorough testing with reliable validation (4M)",
      level3_desc: "Conducts effective testing with minor limitations (3M)",
      level2_desc: "Applies basic testing with partial validation (2M)",
      level1_desc: "Shows limited testing with insufficient validation (1M)",
    },
    {
      co_code: "CO5",
      name: "Results Interpretation & Reporting",
      max_marks: 5,
      weightage: 25,
      level5_desc: "Presents outstanding evaluation with comprehensive and clear reporting (5M)",
      level4_desc: "Provides detailed evaluation with clear reporting (4M)",
      level3_desc: "Demonstrates good evaluation with minor gaps (3M)",
      level2_desc: "Illustrates basic evaluation with limited reporting (2M)",
      level1_desc: "Displays weak analysis with inadequate reporting (1M)",
    },
    {
      co_code: "CO6",
      name: "System Demonstration & Functionality",
      max_marks: 5,
      weightage: 25,
      level5_desc: "Showcases excellent demonstration with flawless functionality (5M)",
      level4_desc: "Exhibits complete demonstration with seamless functionality (4M)",
      level3_desc: "Demonstrates effective functionality with minor issues (3M)",
      level2_desc: "Reveals partial demonstration with limited functionality (2M)",
      level1_desc: "Indicates incomplete demonstration with significant issues (1M)",
    },
    {
      co_code: "CO6",
      name: "Project Significance & Future Scope",
      max_marks: 5,
      weightage: 25,
      level5_desc: "Establishes exceptional impact assessment with innovative future scope (5M)",
      level4_desc: "Highlights strong impact assessment with clear future scope (4M)",
      level3_desc: "Explains good impact evaluation with minor gaps (3M)",
      level2_desc: "Discusses basic impact evaluation with limited future scope (2M)",
      level1_desc: "Mentions minimal impact evaluation (1M)",
    },
  ];

  for (const c of officialCriteria) {
    await pool.query(
      `INSERT INTO rubric_criteria (rubric_id, co_code, name, weightage, max_marks, level5_desc, level4_desc, level3_desc, level2_desc, level1_desc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT DO NOTHING`,
      [
        rubricId,
        c.co_code,
        c.name,
        c.weightage,
        c.max_marks,
        c.level5_desc,
        c.level4_desc,
        c.level3_desc,
        c.level2_desc,
        c.level1_desc,
      ]
    );
  }

  console.log("Official GM University PBL Assessment Review 3 Rubric criteria seeded!");
  await pool.end();
}

main().catch(console.error);
