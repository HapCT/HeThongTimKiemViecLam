const { pool } = require('../config/db');

// GET /api/jobs (Search & Filter)
exports.getJobs = async (req, res) => {
  try {
    const {
      keyword,
      category_id,
      location,
      job_type,
      status: requestedStatus,
      min_salary,
      max_salary,
      page = 1,
      limit = 10,
      company_id
    } = req.query;

    // Giới hạn trần limit tối đa 50 và trang tối thiểu là 1 để chống DoS
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const offset = (safePage - 1) * safeLimit;
    const params = [];
    let whereClauses = ['j.is_deleted = 0'];

    // Phân quyền lọc trạng thái (status):
    // - Khách vãng lai và ứng viên: bắt buộc chỉ xem 'approved' (kể cả có gửi ?status=all hay ?status=pending)
    // - Quản trị viên: xem được mọi status
    // - Doanh nghiệp: nếu tìm đúng company_id của chính mình thì được xem status bất kỳ; tìm chung thị trường thì chỉ xem 'approved'
    const role = req.user?.role;
    let effectiveStatus = 'approved';
    if (role === 'admin') {
      effectiveStatus = requestedStatus || 'approved';
    } else if (role === 'company' && company_id && parseInt(company_id, 10) === req.user.company_id) {
      effectiveStatus = requestedStatus || 'all';
    } else {
      effectiveStatus = 'approved';
    }

    if (effectiveStatus !== 'all') {
      whereClauses.push('j.status = ?');
      params.push(effectiveStatus);
    }

    // Ẩn các tin đã quá hạn nộp hồ sơ khi tìm kiếm việc làm công khai đang tuyển
    if (effectiveStatus === 'approved') {
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

    const queryParams = [candidateId, candidateId, ...params, safeLimit, offset];
    const [jobs] = await pool.query(dataSql, queryParams);

    return res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit)
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

    const job = rows[0];

    // Nếu tin chưa được phê duyệt, chỉ Admin hoặc doanh nghiệp đăng tin mới được xem
    if (job.status !== 'approved') {
      const isOwner = req.user?.company_id && req.user.company_id === job.company_id;
      const isAdmin = req.user?.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng hoặc tin chưa được công khai' });
      }
    }

    // Increment view count khi người xem hợp lệ truy cập
    await pool.query('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('getJobById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết tin tuyển dụng' });
  }
};

// POST /api/jobs (Create Job)
exports.createJob = async (req, res) => {
  try {
    let companyId = req.user.company_id;
    if (req.user.role === 'admin') {
      companyId = req.body.company_id || companyId;
    }

    if (!companyId) {
      return res.status(403).json({ success: false, message: 'Chỉ tài khoản doanh nghiệp hoặc quản trị viên có chỉ định doanh nghiệp mới được đăng tin' });
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

    // Notify admin nếu doanh nghiệp tự đăng tin mới
    if (req.user.role !== 'admin') {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const adminUserId = admins.length > 0 ? admins[0].id : 1;
      await pool.query(
        `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
         VALUES (?, ?, 'Tin tuyển dụng mới được tạo', ?, 'job', ?)`,
        [adminUserId, req.user.id, `Doanh nghiệp đã đăng tin "${title}"`, result.insertId]
      );
    }

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
      status: requestedStatus
    } = req.body;

    // Verify ownership
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? AND is_deleted = 0', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy việc làm' });
    }

    const existingJob = jobs[0];

    if (req.user.role !== 'admin' && existingJob.company_id !== req.user.company_id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa tin này' });
    }

    // Xử lý trạng thái (status) & doanh nghiệp sở hữu (company_id):
    // - Admin: được chỉ định trạng thái mới trong danh sách hợp lệ; nếu thay đổi company_id thì công ty phải tồn tại
    // - Doanh nghiệp: nếu tin đang 'approved' mà sửa đổi thông tin thì tự động đưa về 'pending' để admin duyệt lại
    let nextStatus = existingJob.status;
    let targetCompanyId = existingJob.company_id;

    if (req.user.role === 'admin') {
      if (requestedStatus) {
        if (!['pending', 'approved', 'rejected', 'closed'].includes(requestedStatus)) {
          return res.status(400).json({ success: false, message: 'Trạng thái tin tuyển dụng không hợp lệ' });
        }
        nextStatus = requestedStatus;
      }
      if (req.body.company_id) {
        const [comp] = await pool.query('SELECT id FROM companies WHERE id = ?', [req.body.company_id]);
        if (comp.length === 0) {
          return res.status(400).json({ success: false, message: 'Doanh nghiệp được chỉ định không tồn tại' });
        }
        targetCompanyId = req.body.company_id;
      }
    } else {
      if (existingJob.status === 'approved') {
        nextStatus = 'pending';
      }
    }

    await pool.query(
      `UPDATE jobs
       SET company_id = ?,
           title = COALESCE(?, title),
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
           status = ?
       WHERE id = ?`,
      [
        targetCompanyId,
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
        nextStatus,
        id
      ]
    );

    res.json({
      success: true,
      message: nextStatus === 'pending' && existingJob.status === 'approved'
        ? 'Cập nhật tin tuyển dụng thành công. Tin đã chuyển về trạng thái chờ duyệt lại.'
        : 'Cập nhật tin tuyển dụng thành công'
    });
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

    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ? AND is_deleted = 0', [id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy việc làm' });
    }

    const job = jobs[0];

    // Phân quyền cập nhật trạng thái:
    // - Doanh nghiệp: chỉ được cập nhật tin của chính mình và chỉ được chuyển sang 'closed' hoặc 'pending'
    // - Không được tự duyệt 'approved' hoặc 'rejected'
    if (req.user.role !== 'admin') {
      if (!req.user.company_id || job.company_id !== req.user.company_id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thay đổi trạng thái tin tuyển dụng này' });
      }

      if (['approved', 'rejected'].includes(status)) {
        return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới có quyền phê duyệt hoặc từ chối tin tuyển dụng' });
      }
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
