const { pool } = require('../config/db');

// GET /api/stats/admin
exports.getAdminStats = async (req, res) => {
  try {
    const [[{ total_candidates }]] = await pool.query('SELECT COUNT(*) AS total_candidates FROM candidates');
    const [[{ total_companies }]] = await pool.query('SELECT COUNT(*) AS total_companies FROM companies');
    const [[{ total_jobs }]] = await pool.query('SELECT COUNT(*) AS total_jobs FROM jobs WHERE is_deleted = 0');
    const [[{ pending_jobs }]] = await pool.query("SELECT COUNT(*) AS pending_jobs FROM jobs WHERE status = 'pending' AND is_deleted = 0");
    const [[{ total_applications }]] = await pool.query('SELECT COUNT(*) AS total_applications FROM applications');
    const [[{ total_interviews }]] = await pool.query('SELECT COUNT(*) AS total_interviews FROM interviews');

    // Jobs by Category
    const [jobsByCategory] = await pool.query(`
      SELECT cat.name AS category_name, COUNT(j.id) AS job_count
      FROM categories cat
      LEFT JOIN jobs j ON cat.id = j.category_id AND j.is_deleted = 0
      GROUP BY cat.id, cat.name
      ORDER BY job_count DESC
    `);

    // Applications by status
    const [appsByStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM applications
      GROUP BY status
    `);

    // Recent jobs
    const [recentJobs] = await pool.query(`
      SELECT j.id, j.title, j.location, j.job_type, j.status, j.created_at, comp.name AS company_name
      FROM jobs j
      JOIN companies comp ON j.company_id = comp.id
      WHERE j.is_deleted = 0
      ORDER BY j.created_at DESC
      LIMIT 5
    `);

    // Recent applications
    const [recentApplications] = await pool.query(`
      SELECT a.id, a.status, a.applied_at,
             j.title AS job_title,
             c.full_name AS candidate_name,
             comp.name AS company_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN companies comp ON j.company_id = comp.id
      ORDER BY a.applied_at DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        summary: {
          total_candidates,
          total_companies,
          total_jobs,
          pending_jobs,
          total_applications,
          total_interviews
        },
        jobsByCategory,
        appsByStatus,
        recentJobs,
        recentApplications
      }
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy thống kê quản trị' });
  }
};

// GET /api/stats/company
exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ dành cho tài khoản công ty' });
    }

    const [[{ total_jobs }]] = await pool.query('SELECT COUNT(*) AS total_jobs FROM jobs WHERE company_id = ? AND is_deleted = 0', [companyId]);
    const [[{ active_jobs }]] = await pool.query("SELECT COUNT(*) AS active_jobs FROM jobs WHERE company_id = ? AND status = 'approved' AND is_deleted = 0", [companyId]);
    const [[{ total_applications }]] = await pool.query(
      'SELECT COUNT(a.id) AS total_applications FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?',
      [companyId]
    );
    const [[{ pending_applications }]] = await pool.query(
      "SELECT COUNT(a.id) AS pending_applications FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ? AND a.status = 'submitted'",
      [companyId]
    );
    const [[{ total_interviews }]] = await pool.query(
      'SELECT COUNT(i.id) AS total_interviews FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.company_id = ?',
      [companyId]
    );

    // Job applicant counts
    const [jobStats] = await pool.query(`
      SELECT j.id, j.title, j.view_count, j.status,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicants_count
      FROM jobs j
      WHERE j.company_id = ? AND j.is_deleted = 0
      ORDER BY j.created_at DESC
      LIMIT 10
    `, [companyId]);

    res.json({
      success: true,
      data: {
        summary: {
          total_jobs,
          active_jobs,
          total_applications,
          pending_applications,
          total_interviews
        },
        jobStats
      }
    });
  } catch (error) {
    console.error('getCompanyStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/stats/public
exports.getPublicStats = async (req, res) => {
  try {
    const [[{ total_jobs }]] = await pool.query("SELECT COUNT(*) AS total_jobs FROM jobs WHERE status = 'approved' AND is_deleted = 0");
    const [[{ total_companies }]] = await pool.query('SELECT COUNT(*) AS total_companies FROM companies');
    const [[{ total_candidates }]] = await pool.query('SELECT COUNT(*) AS total_candidates FROM candidates');
    const [[{ total_applications }]] = await pool.query('SELECT COUNT(*) AS total_applications FROM applications');
    const [[{ accepted_count }]] = await pool.query("SELECT COUNT(*) AS accepted_count FROM applications WHERE status = 'accepted'");

    const rate = total_applications > 0 ? Math.round((accepted_count / total_applications) * 100) : 95;

    res.json({
      success: true,
      data: {
        total_jobs,
        total_companies,
        total_candidates,
        total_applications,
        acceptance_rate: rate
      }
    });
  } catch (error) {
    console.error('getPublicStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
