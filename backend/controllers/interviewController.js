const { pool } = require('../config/db');
const { sendInterviewEmail } = require('../services/emailService');

// POST /api/interviews (Company schedules interview)
exports.scheduleInterview = async (req, res) => {
  try {
    let { application_id, scheduled_at, format = 'online', location, note } = req.body;
    if (format !== 'offline') {
      format = 'online';
    }

    if (!application_id || !scheduled_at || !location) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn ứng tuyển, thời gian và địa điểm/link phỏng vấn' });
    }

    const [apps] = await pool.query(
      `SELECT a.*, j.title AS job_title, c.user_id AS candidate_user_id, c.full_name AS candidate_name, u.email AS candidate_email, comp.name AS company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies comp ON j.company_id = comp.id
       JOIN candidates c ON a.candidate_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE a.id = ?`,
      [application_id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }

    const app = apps[0];

    const [result] = await pool.query(
      `INSERT INTO interviews (application_id, scheduled_at, format, location, note, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [application_id, scheduled_at, format, location, note || null]
    );

    // Also set application status to interview
    await pool.query("UPDATE applications SET status = 'interview' WHERE id = ?", [application_id]);

    // Send notification to candidate in DB
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
       VALUES (?, ?, ?, ?, 'interview', ?)`,
      [
        app.candidate_user_id,
        req.user.id,
        `Lời mời phỏng vấn từ ${app.company_name}`,
        `Bạn có lịch phỏng vấn vị trí "${app.job_title}" vào lúc ${scheduled_at}. Hình thức: ${format.toUpperCase()}. Chi tiết: ${location}`,
        result.insertId
      ]
    );

    // Send real/simulated email to candidate
    sendInterviewEmail({
      toEmail: app.candidate_email,
      candidateName: app.candidate_name,
      companyName: app.company_name,
      jobTitle: app.job_title,
      scheduledAt: scheduled_at,
      format,
      location,
      note
    }).catch(err => console.error('Email sending error:', err));

    res.status(201).json({
      success: true,
      message: 'Đặt lịch phỏng vấn thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('scheduleInterview error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đặt lịch phỏng vấn' });
  }
};

// GET /api/interviews/candidate
exports.getCandidateInterviews = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có danh sách phỏng vấn' });
    }

    const sql = `
      SELECT i.*,
             j.title AS job_title, j.job_type,
             comp.name AS company_name, comp.logo_url AS company_logo, comp.address AS company_address,
             a.id AS application_id, a.status AS application_status
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      WHERE a.candidate_id = ?
      ORDER BY i.scheduled_at ASC
    `;

    const [rows] = await pool.query(sql, [candidateId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCandidateInterviews error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/interviews/company
exports.getCompanyInterviews = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ doanh nghiệp mới có danh sách phỏng vấn' });
    }

    const sql = `
      SELECT i.*,
             j.title AS job_title,
             c.full_name AS candidate_name, c.phone AS candidate_phone, c.university, c.major,
             c.avatar_url AS candidate_avatar, u.email AS candidate_email,
             a.id AS application_id
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE j.company_id = ?
      ORDER BY i.scheduled_at ASC
    `;

    const [rows] = await pool.query(sql, [companyId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCompanyInterviews error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/interviews/:id/status
exports.updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['scheduled', 'confirmed', 'declined', 'cancelled', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái phỏng vấn không hợp lệ' });
    }

    await pool.query(
      `UPDATE interviews
       SET status = ?, note = COALESCE(?, note)
       WHERE id = ?`,
      [status, note || null, id]
    );

    res.json({ success: true, message: `Đã cập nhật trạng thái phỏng vấn: ${status}` });
  } catch (error) {
    console.error('updateInterviewStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
