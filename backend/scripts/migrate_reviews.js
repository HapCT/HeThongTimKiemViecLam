const { pool } = require('../config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_reviews (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        company_id INT UNSIGNED NOT NULL,
        candidate_id INT UNSIGNED NOT NULL,
        rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
        comment TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        INDEX idx_comp_review (company_id)
      ) ENGINE=InnoDB;
    `);

    console.log('✅ Created company_reviews table successfully!');

    // Add sample reviews if empty
    const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM company_reviews');
    if (existing[0].cnt === 0) {
      const [candidates] = await pool.query('SELECT id FROM candidates LIMIT 2');
      const [companies] = await pool.query('SELECT id FROM companies LIMIT 2');
      if (candidates.length > 0 && companies.length > 0) {
        await pool.query(`
          INSERT INTO company_reviews (company_id, candidate_id, rating, comment) VALUES
          (?, ?, 5, 'Môi trường làm việc cực kỳ chuyên nghiệp, được các anh chị Senior hướng dẫn nhiệt tình và tham gia dự án thực tế.'),
          (?, ?, 4, 'Chế độ phụ cấp thực tập sinh tốt, cơ sở vật chất hiện đại, học hỏi được rất nhiều công nghệ mới.')
        `, [companies[0].id, candidates[0].id, companies[0].id, candidates[0].id]);
        console.log('✅ Seeded sample company reviews!');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
