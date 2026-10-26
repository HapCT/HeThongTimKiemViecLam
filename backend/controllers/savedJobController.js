const { pool } = require('../config/db');

// POST /api/saved-jobs/toggle
exports.toggleSaveJob = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có thể lưu việc làm' });
    }

    const { job_id } = req.body;
    if (!job_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp job_id' });
    }

    const [existing] = await pool.query('SELECT * FROM saved_jobs WHERE candidate_id = ? AND job_id = ?', [candidateId, job_id]);

    if (existing.length > 0) {
      await pool.query('DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?', [candidateId, job_id]);
      return res.json({ success: true, message: 'Đã bỏ lưu tin tuyển dụng', data: { is_saved: false } });
    } else {
      await pool.query('INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)', [candidateId, job_id]);
      return res.json({ success: true, message: 'Đã lưu việc làm vào mục yêu thích', data: { is_saved: true } });
    }
  } catch (error) {
    console.error('toggleSaveJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/saved-jobs
exports.getSavedJobs = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có danh sách yêu thích' });
    }

    const sql = `
      SELECT j.*,
             comp.name AS company_name, comp.logo_url AS company_logo, comp.address AS company_address,
             cat.name AS category_name,
             sj.saved_at,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
             1 AS is_saved
      FROM saved_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      LEFT JOIN categories cat ON j.category_id = cat.id
      WHERE sj.candidate_id = ? AND j.is_deleted = 0
      ORDER BY sj.saved_at DESC
    `;

    const [rows] = await pool.query(sql, [candidateId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getSavedJobs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
