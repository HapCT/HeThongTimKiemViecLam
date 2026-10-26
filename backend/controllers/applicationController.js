const { pool } = require('../config/db');
const { sendApplicationStatusEmail } = require('../services/emailService');

// POST /api/applications (Apply for a Job)
exports.applyJob = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ tài khoản ứng viên mới có thể nộp đơn' });
    }

    const { job_id, cv_id, cover_letter } = req.body;
    if (!job_id || !cv_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn việc làm và CV để nộp' });
    }

    // Check if job exists and is open
    const [jobs] = await pool.query('SELECT j.*, c.user_id AS company_user_id FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.id = ? AND j.is_deleted = 0', [job_id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Tin tuyển dụng không tồn tại hoặc đã đóng' });
    }
    const job = jobs[0];
    if (job.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Tin tuyển dụng hiện không mở nhận hồ sơ ứng tuyển' });
    }

    if (job.deadline && new Date(job.deadline) < new Date(new Date().toDateString())) {
      return res.status(400).json({ success: false, message: 'Tin tuyển dụng này đã hết hạn nộp hồ sơ' });
    }

    // Check if CV belongs to candidate
    const [cvs] = await pool.query('SELECT id FROM cvs WHERE id = ? AND candidate_id = ?', [cv_id, candidateId]);
    if (cvs.length === 0) {
      return res.status(400).json({ success: false, message: 'CV không hợp lệ hoặc không thuộc về bạn' });
    }

    // Check if already applied
    const [existing] = await pool.query('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?', [job_id, candidateId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Bạn đã ứng tuyển vào tin tuyển dụng này rồi' });
    }

    const [result] = await pool.query(
      `INSERT INTO applications (job_id, candidate_id, cv_id, cover_letter, status)
       VALUES (?, ?, ?, ?, 'submitted')`,
      [job_id, candidateId, cv_id, cover_letter || null]
    );

    // Notify company
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
       VALUES (?, ?, 'Hồ sơ ứng tuyển mới', ?, 'application', ?)`,
      [
        job.company_user_id,
        req.user.id,
        `Ứng viên ${req.user.candidate_name || 'Phạm Huy Anh'} vừa nộp hồ sơ vào tin "${job.title}"`,
        result.insertId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Ứng tuyển thành công! Nhà tuyển dụng sẽ sớm liên hệ với bạn.',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('applyJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi nộp hồ sơ ứng tuyển' });
  }
};

// GET /api/applications/my-applications (For Candidate)
exports.getCandidateApplications = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có danh sách ứng tuyển' });
    }

    const sql = `
      SELECT a.*,
             j.title AS job_title, j.job_type, j.location AS job_location,
             j.salary_min, j.salary_max, j.salary_negotiable,
             comp.name AS company_name, comp.logo_url AS company_logo, comp.address AS company_address,
             cv.title AS cv_title, cv.file_url AS cv_file_url,
             i.id AS interview_id, i.scheduled_at AS interview_time, i.format AS interview_format,
             i.location AS interview_location, i.status AS interview_status, i.note AS interview_note
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies comp ON j.company_id = comp.id
      JOIN cvs cv ON a.cv_id = cv.id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `;

    const [applications] = await pool.query(sql, [candidateId]);
    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('getCandidateApplications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy lịch sử ứng tuyển' });
  }
};

// GET /api/applications/company/all (For Company)
exports.getCompanyApplications = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ doanh nghiệp mới được xem danh sách này' });
    }

    const { job_id, status } = req.query;
    let whereClauses = ['j.company_id = ?'];
    const params = [companyId];

    if (job_id) {
      whereClauses.push('a.job_id = ?');
      params.push(job_id);
    }

    if (status && status !== 'all') {
      whereClauses.push('a.status = ?');
      params.push(status);
    }

    const sql = `
      SELECT a.*,
             j.title AS job_title, j.location AS job_location,
             c.full_name AS candidate_name, c.phone AS candidate_phone, c.university, c.major,
             c.gpa, c.avatar_url AS candidate_avatar, u.email AS candidate_email,
             cv.title AS cv_title, cv.type AS cv_type, cv.content AS cv_content, cv.file_url AS cv_file_url,
             i.id AS interview_id, i.scheduled_at AS interview_time, i.format AS interview_format,
             i.location AS interview_location, i.status AS interview_status
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN cvs cv ON a.cv_id = cv.id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY a.applied_at DESC
    `;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCompanyApplications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ứng viên' });
  }
};

// PATCH /api/applications/:id/status (Company updates status)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['submitted', 'viewed', 'interview', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái ứng tuyển không hợp lệ' });
    }

    const [apps] = await pool.query(
      `SELECT a.*, j.title AS job_title, c.user_id AS candidate_user_id, c.full_name AS candidate_name, u.email AS candidate_email, comp.name AS company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN companies comp ON j.company_id = comp.id
       JOIN candidates c ON a.candidate_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }

    const app = apps[0];

    await pool.query(
      `UPDATE applications
       SET status = ?, note = COALESCE(?, note)
       WHERE id = ?`,
      [status, note, id]
    );

    // Notify candidate
    const statusLabels = {
      viewed: 'đã xem hồ sơ của bạn',
      interview: 'mời bạn tham gia phỏng vấn',
      accepted: 'đã tiếp nhận hồ sơ trúng tuyển của bạn',
      rejected: 'đã phản hồi về hồ sơ của bạn'
    };

    if (status !== 'submitted') {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
         VALUES (?, ?, ?, ?, 'application', ?)`,
        [
          app.candidate_user_id,
          req.user.id,
          `Cập nhật hồ sơ ứng tuyển: ${app.job_title}`,
          `Doanh nghiệp ${app.company_name} ${statusLabels[status] || 'đã cập nhật trạng thái hồ sơ'}. ${note ? 'Ghi chú: ' + note : ''}`,
          id
        ]
      );
    }

    // Send email to candidate when accepted or rejected
    if (['accepted', 'rejected'].includes(status)) {
      sendApplicationStatusEmail({
        toEmail: app.candidate_email,
        candidateName: app.candidate_name,
        companyName: app.company_name,
        jobTitle: app.job_title,
        status,
        note
      }).catch(err => console.error('Email status sending error:', err));
    }

    res.json({ success: true, message: 'Cập nhật trạng thái ứng viên thành công' });
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái ứng viên' });
  }
};
