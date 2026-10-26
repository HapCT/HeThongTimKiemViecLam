const { pool } = require('../config/db');

// GET /api/companies
exports.getCompanies = async (req, res) => {
  try {
    const { keyword, industry } = req.query;
    let where = [];
    let params = [];

    if (keyword) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (industry) {
      where.push('industry LIKE ?');
      params.push(`%${industry}%`);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM jobs j WHERE j.company_id = c.id AND j.status = 'approved' AND j.is_deleted = 0) AS active_jobs_count
      FROM companies c
      ${whereSql}
      ORDER BY c.id ASC
    `;

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCompanies error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/companies/:id
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM companies WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy doanh nghiệp' });
    }

    const company = rows[0];
    const candidateId = req.user?.candidate_id || 0;

    // Get active jobs of this company
    const [jobs] = await pool.query(
      `SELECT j.*, cat.name AS category_name,
              comp.name AS company_name, comp.logo_url AS company_logo,
              (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS applicant_count,
              (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.job_id = j.id AND sj.candidate_id = ?) AS is_saved,
              (SELECT a.status FROM applications a WHERE a.job_id = j.id AND a.candidate_id = ? LIMIT 1) AS application_status
       FROM jobs j
       LEFT JOIN categories cat ON j.category_id = cat.id
       LEFT JOIN companies comp ON j.company_id = comp.id
       WHERE j.company_id = ? AND j.status = 'approved' AND j.is_deleted = 0
       ORDER BY j.created_at DESC`,
      [candidateId, candidateId, id]
    );

    res.json({ success: true, data: { ...company, jobs } });
  } catch (error) {
    console.error('getCompanyById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// GET /api/companies/:id/reviews
exports.getCompanyReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const [reviews] = await pool.query(
      `SELECT cr.*, cand.full_name AS candidate_name, cand.university, cand.avatar_url AS candidate_avatar
       FROM company_reviews cr
       JOIN candidates cand ON cr.candidate_id = cand.id
       WHERE cr.company_id = ?
       ORDER BY cr.created_at DESC`,
      [id]
    );

    const [[{ avg_rating, total_reviews }]] = await pool.query(
      `SELECT COALESCE(ROUND(AVG(rating), 1), 5.0) AS avg_rating, COUNT(*) AS total_reviews
       FROM company_reviews WHERE company_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        avg_rating: parseFloat(avg_rating) || 5.0,
        total_reviews,
        reviews
      }
    });
  } catch (error) {
    console.error('getCompanyReviews error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy đánh giá doanh nghiệp' });
  }
};

// POST /api/companies/:id/reviews
exports.addCompanyReview = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên/sinh viên mới có quyền gửi đánh giá doanh nghiệp' });
    }

    const { id } = req.params;
    const { rating = 5, comment } = req.body;

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nhận xét ít nhất 5 ký tự' });
    }

    const [result] = await pool.query(
      `INSERT INTO company_reviews (company_id, candidate_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [id, candidateId, Math.min(5, Math.max(1, parseInt(rating, 10))), comment.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá môi trường thực tập!',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('addCompanyReview error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi đánh giá' });
  }
};
