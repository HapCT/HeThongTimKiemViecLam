const { pool } = require('../config/db');

// POST /api/saved-jobs/toggle (Hỗ trợ cả body { job_id } hoặc params :jobId)
exports.toggleSaveJob = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có thể lưu việc làm' });
    }

    const jobId = req.body?.job_id || req.params?.jobId;
    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp job_id' });
    }

    const [existing] = await pool.query('SELECT * FROM saved_jobs WHERE candidate_id = ? AND job_id = ?', [candidateId, jobId]);

    // Nếu đã lưu thì luôn cho phép bỏ lưu bất kể trạng thái tin
    if (existing.length > 0) {
      await pool.query('DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?', [candidateId, jobId]);
      return res.json({ success: true, message: 'Đã bỏ lưu tin tuyển dụng', data: { is_saved: false } });
    }

    // Nếu chưa lưu: chỉ cho lưu tin approved và chưa bị xóa; ngược lại trả 404
    const [jobs] = await pool.query('SELECT id, status, is_deleted FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0 || jobs[0].is_deleted === 1 || jobs[0].status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Tin tuyển dụng không tồn tại hoặc chưa được công khai' });
    }

    await pool.query('INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)', [candidateId, jobId]);
    return res.json({ success: true, message: 'Đã lưu việc làm vào mục yêu thích', data: { is_saved: true } });
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

    // Chỉ trả đầy đủ nội dung nếu tin approved; nếu tin bị đóng/gỡ thì trả dạng rút gọn (ẩn nội dung chi tiết)
    const sql = `
      SELECT j.id,
             j.title,
             j.status,
             j.company_id,
             comp.name AS company_name,
             comp.logo_url AS company_logo,
             comp.address AS company_address,
             sj.saved_at,
             1 AS is_saved,
             CASE WHEN j.status = 'approved' AND (j.deadline IS NULL OR j.deadline >= CURDATE()) THEN 1 ELSE 0 END AS is_available,
             CASE WHEN j.status = 'approved' THEN j.description ELSE NULL END AS description,
             CASE WHEN j.status = 'approved' THEN j.requirements ELSE NULL END AS requirements,
             CASE WHEN j.status = 'approved' THEN j.benefits ELSE NULL END AS benefits,
             CASE WHEN j.status = 'approved' THEN j.salary_min ELSE NULL END AS salary_min,
             CASE WHEN j.status = 'approved' THEN j.salary_max ELSE NULL END AS salary_max,
             CASE WHEN j.status = 'approved' THEN j.salary_negotiable ELSE 0 END AS salary_negotiable,
             CASE WHEN j.status = 'approved' THEN j.location ELSE NULL END AS location,
             CASE WHEN j.status = 'approved' THEN j.job_type ELSE NULL END AS job_type,
             CASE WHEN j.status = 'approved' THEN j.deadline ELSE NULL END AS deadline,
             CASE WHEN j.status = 'approved' THEN cat.name ELSE NULL END AS category_name,
             CASE WHEN j.status = 'approved' THEN (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) ELSE 0 END AS applicant_count
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
