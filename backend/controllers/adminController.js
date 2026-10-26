const { pool } = require('../config/db');

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, status, keyword } = req.query;
    let where = [];
    let params = [];

    if (role && role !== 'all') {
      where.push('u.role = ?');
      params.push(role);
    }

    if (status && status !== 'all') {
      where.push('u.status = ?');
      params.push(status);
    }

    if (keyword) {
      where.push('(u.email LIKE ? OR cand.full_name LIKE ? OR comp.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT u.id, u.firebase_uid, u.email, u.role, u.status, u.created_at,
             cand.id AS candidate_id, cand.full_name AS candidate_name, cand.phone AS candidate_phone, cand.university, cand.major,
             comp.id AS company_id, comp.name AS company_name, comp.phone AS company_phone, comp.industry, comp.size,
             comp.tax_code, comp.website, comp.address
      FROM users u
      LEFT JOIN candidates cand ON u.id = cand.user_id
      LEFT JOIN companies comp ON u.id = comp.user_id
      ${whereSql}
      ORDER BY u.id DESC
    `;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('admin getUsers error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'locked', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    // Do not lock current admin
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự khóa tài khoản của chính mình' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Đã cập nhật trạng thái tài khoản thành ${status}` });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/admin/jobs
exports.getAdminJobs = async (req, res) => {
  try {
    const { status, keyword } = req.query;
    let where = ['j.is_deleted = 0'];
    let params = [];

    if (status && status !== 'all') {
      where.push('j.status = ?');
      params.push(status);
    }

    if (keyword) {
      where.push('(j.title LIKE ? OR comp.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const sql = `
      SELECT j.*,
             comp.name AS company_name, comp.logo_url AS company_logo,
             cat.name AS category_name,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count
      FROM jobs j
      JOIN companies comp ON j.company_id = comp.id
      LEFT JOIN categories cat ON j.category_id = cat.id
      WHERE ${where.join(' AND ')}
      ORDER BY j.created_at DESC
    `;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getAdminJobs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/admin/jobs/:id/review
exports.reviewJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    if (!['approved', 'rejected', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái duyệt không hợp lệ' });
    }

    const [jobs] = await pool.query(
      `SELECT j.*, comp.user_id AS company_user_id, comp.name AS company_name
       FROM jobs j
       JOIN companies comp ON j.company_id = comp.id
       WHERE j.id = ?`,
      [id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy việc làm' });
    }

    const job = jobs[0];

    await pool.query(
      `UPDATE jobs
       SET status = ?,
           reject_reason = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [status, reject_reason || null, req.user.id, id]
    );

    // Notify company
    const notifTitle = status === 'approved' ? 'Tin tuyển dụng đã được phê duyệt' : 'Tin tuyển dụng bị từ chối';
    const notifBody = status === 'approved'
      ? `Tin tuyển dụng "${job.title}" của bạn đã được duyệt và bắt đầu hiển thị cho ứng viên.`
      : `Tin tuyển dụng "${job.title}" bị từ chối phê duyệt. Lý do: ${reject_reason || 'Chưa đạt yêu cầu'}`;

    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
       VALUES (?, ?, ?, ?, 'job', ?)`,
      [job.company_user_id, req.user.id, notifTitle, notifBody, id]
    );

    res.json({ success: true, message: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tin tuyển dụng thành công` });
  } catch (error) {
    console.error('reviewJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
