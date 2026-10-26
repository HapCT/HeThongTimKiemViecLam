const { pool } = require('../config/db');

// GET /api/jobs (Search & Filter)
exports.getJobs = async (req, res) => {
  try {
    const {
      keyword,
      category_id,
      location,
      job_type,
      status = 'approved',
      min_salary,
      max_salary,
      page = 1,
      limit = 10,
      company_id
    } = req.query;

    // Tự động đóng các tin tuyển dụng đã quá hạn nộp hồ sơ
    await pool.query("UPDATE jobs SET status = 'closed' WHERE status = 'approved' AND deadline IS NOT NULL AND deadline < CURDATE()");

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClauses = ['j.is_deleted = 0'];

    // Status filter
    if (status !== 'all') {
      whereClauses.push('j.status = ?');
      params.push(status);
    }

    // Ẩn các tin đã quá hạn nộp hồ sơ khi ứng viên tìm kiếm việc làm đang tuyển
    if (status === 'approved') {
      whereClauses.push('(j.deadline IS NULL OR j.deadline >= CURDATE())');
    }

    if (company_id) {
      whereClauses.push('j.company_id = ?');
      params.push(company_id);
    }

    if (category_id) {
      whereClauses.push('j.category_id = ?');
      params.push(category_id);
    }

    if (job_type) {
      whereClauses.push('j.job_type = ?');
      params.push(job_type);
    }

    if (location) {
      whereClauses.push('j.location LIKE ?');
      params.push(`%${location.trim()}%`);
    }

    if (keyword) {
      whereClauses.push('(j.title LIKE ? OR j.description LIKE ? OR comp.name LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (min_salary) {
      whereClauses.push('(j.salary_max >= ? OR j.salary_negotiable = 1)');
      params.push(parseInt(min_salary, 10));
    }

    if (max_salary) {
      whereClauses.push('(j.salary_min <= ? OR j.salary_negotiable = 1)');
      params.push(parseInt(max_salary, 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM jobs j
      LEFT JOIN companies comp ON j.company_id = comp.id
      ${whereSql}
    `;
    const [countResult] = await pool.query(countSql, params);
    const total = countResult[0].total;

    // Data query
    const candidateId = req.user?.candidate_id || 0;
    const dataSql = `
      SELECT j.*,
             comp.name AS company_name, comp.logo_url AS company_logo, comp.address AS company_address,
             cat.name AS category_name,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
             (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id AND sj.candidate_id = ?) AS is_saved,
             (SELECT a.status FROM applications a WHERE a.job_id = j.id AND a.candidate_id = ? LIMIT 1) AS application_status
      FROM jobs j
      LEFT JOIN companies comp ON j.company_id = comp.id
      LEFT JOIN categories cat ON j.category_id = cat.id
      ${whereSql}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [candidateId, candidateId, ...params, parseInt(limit, 10), offset];
    const [jobs] = await pool.query(dataSql, queryParams);

    return res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / parseInt(limit, 10))
        }
      }
    });
  } catch (error) {
    console.error('getJobs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách việc làm' });
  }
};

// GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user?.candidate_id || 0;

    // Increment view count
    await pool.query('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?', [id]);

    const sql = `
      SELECT j.*,
             comp.name AS company_name, comp.logo_url AS company_logo, comp.address AS company_address,
             comp.website AS company_website, comp.phone AS company_phone, comp.industry AS company_industry,
             comp.size AS company_size, comp.description AS company_description,
             cat.name AS category_name,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
             (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id AND sj.candidate_id = ?) AS is_saved,
             (SELECT a.id FROM applications a WHERE a.job_id = j.id AND a.candidate_id = ? LIMIT 1) AS applied_application_id,
             (SELECT a.status FROM applications a WHERE a.job_id = j.id AND a.candidate_id = ? LIMIT 1) AS application_status
      FROM jobs j
      LEFT JOIN companies comp ON j.company_id = comp.id
      LEFT JOIN categories cat ON j.category_id = cat.id
      WHERE j.id = ? AND j.is_deleted = 0
    `;

    const [rows] = await pool.query(sql, [candidateId, candidateId, candidateId, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getJobById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết tin tuyển dụng' });
  }
};

// POST /api/jobs (Create Job)
exports.createJob = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ tài khoản doanh nghiệp mới được đăng tin tuyển dụng' });
    }

    const {
      title,
      category_id,
      description,
      requirements,
      benefits,
      job_type = 'internship',
      location,
      salary_min,
      salary_max,
      salary_negotiable = 0,
      quantity = 1,
      deadline,
      status: requestedStatus
    } = req.body;

    const status = req.user.role === 'admin' ? (requestedStatus || 'approved') : 'pending';

    if (!title || !description || !location) {
      return res.status(400).json({ success: false, message: 'Tiêu đề, địa điểm và mô tả công việc là bắt buộc' });
    }

    const [result] = await pool.query(
      `INSERT INTO jobs
       (company_id, category_id, title, description, requirements, benefits, job_type, location, salary_min, salary_max, salary_negotiable, quantity, deadline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        category_id || null,
        title,
        description,
        requirements || '',
        benefits || '',
        job_type,
        location,
        salary_min || null,
        salary_max || null,
        salary_negotiable ? 1 : 0,
        quantity || 1,
        deadline || null,
        status
      ]
    );

    // Notify admin
    await pool.query(
      `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
       VALUES (1, ?, 'Tin tuyển dụng mới được tạo', ?, 'job', ?)`,
      [req.user.id, `Doanh nghiệp đã đăng tin "${title}"`, result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Đăng tin tuyển dụng thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('createJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo tin tuyển dụng' });
  }
};

// PUT /api/jobs/:id (Update Job)
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      category_id,
      description,
      requirements,
      benefits,
      job_type,
      location,
      salary_min,
      salary_max,
      salary_negotiable,
      quantity,
      deadline,
      status
    } = req.body;

    // Verify ownership
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? AND is_deleted = 0', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy việc làm' });
    }

    if (req.user.role !== 'admin' && jobs[0].company_id !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa tin này' });
    }

    await pool.query(
      `UPDATE jobs
       SET title = COALESCE(?, title),
           category_id = COALESCE(?, category_id),
           description = COALESCE(?, description),
           requirements = COALESCE(?, requirements),
           benefits = COALESCE(?, benefits),
           job_type = COALESCE(?, job_type),
           location = COALESCE(?, location),
           salary_min = COALESCE(?, salary_min),
           salary_max = COALESCE(?, salary_max),
           salary_negotiable = COALESCE(?, salary_negotiable),
           quantity = COALESCE(?, quantity),
           deadline = COALESCE(?, deadline),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        title,
        category_id,
        description,
        requirements,
        benefits,
        job_type,
        location,
        salary_min,
        salary_max,
        salary_negotiable,
        quantity,
        deadline,
        status,
        id
      ]
    );

    res.json({ success: true, message: 'Cập nhật tin tuyển dụng thành công' });
  } catch (error) {
    console.error('updateJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật tin tuyển dụng' });
  }
};

// DELETE /api/jobs/:id (Soft Delete)
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin' });
    }

    if (req.user.role !== 'admin' && jobs[0].company_id !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa tin' });
    }

    await pool.query('UPDATE jobs SET is_deleted = 1 WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa tin tuyển dụng thành công' });
  } catch (error) {
    console.error('deleteJob error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa tin tuyển dụng' });
  }
};

// GET /api/jobs/company/my-jobs
exports.getMyCompanyJobs = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ dành cho tài khoản công ty' });
    }

    // Tự động chuyển trạng thái tin hết hạn sang 'closed'
    await pool.query(
      "UPDATE jobs SET status = 'closed' WHERE company_id = ? AND status = 'approved' AND deadline IS NOT NULL AND deadline < CURDATE()",
      [companyId]
    );

    const sql = `
      SELECT j.*,
             cat.name AS category_name,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'submitted') AS pending_applicant_count,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'interview') AS interview_applicant_count
      FROM jobs j
      LEFT JOIN categories cat ON j.category_id = cat.id
      WHERE j.company_id = ? AND j.is_deleted = 0
      ORDER BY j.created_at DESC
    `;
    const [jobs] = await pool.query(sql, [companyId]);
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('getMyCompanyJobs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy tin của công ty' });
  }
};

// PATCH /api/jobs/:id/status
exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;

    if (!['pending', 'approved', 'rejected', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy việc làm' });
    }

    const reviewedBy = req.user.role === 'admin' ? req.user.id : null;
    await pool.query(
      `UPDATE jobs
       SET status = ?,
           reject_reason = ?,
           reviewed_by = COALESCE(?, reviewed_by),
           reviewed_at = CASE WHEN ? IS NOT NULL THEN NOW() ELSE reviewed_at END
       WHERE id = ?`,
      [status, reject_reason || null, reviewedBy, reviewedBy, id]
    );

    res.json({ success: true, message: `Đã cập nhật trạng thái tin thành ${status}` });
  } catch (error) {
    console.error('updateJobStatus error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
