const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// GET /api/candidates/cvs
exports.getCVs = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có danh sách CV' });
    }

    const [cvs] = await pool.query(
      'SELECT id, candidate_id, title, type, content, file_url, is_default, created_at, updated_at FROM cvs WHERE candidate_id = ? ORDER BY is_default DESC, updated_at DESC',
      [candidateId]
    );

    res.json({ success: true, data: cvs });
  } catch (error) {
    console.error('getCVs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách CV' });
  }
};

// GET /api/candidates/cvs/:id
exports.getCVById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM cvs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CV' });
    }

    const cv = rows[0];
    const user = req.user;

    // Chỉ chủ sở hữu CV, hoặc công ty đã nhận đơn ứng tuyển có CV đó, hoặc Admin mới được xem
    if (user.role === 'candidate') {
      if (cv.candidate_id !== user.candidate_id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem CV của ứng viên khác' });
      }
    } else if (user.role === 'company') {
      const [applications] = await pool.query(
        `SELECT a.id FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.cv_id = ? AND j.company_id = ?`,
        [id, user.company_id]
      );
      if (applications.length === 0) {
        return res.status(403).json({ success: false, message: 'Doanh nghiệp chỉ được xem CV của ứng viên đã nộp vào tin của mình' });
      }
    } else if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    res.json({ success: true, data: cv });
  } catch (error) {
    console.error('getCVById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết CV' });
  }
};

// POST /api/candidates/cvs
exports.createCV = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có thể tạo CV' });
    }

    const { title, content, is_default = 0 } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên/tiêu đề CV' });
    }

    if (is_default) {
      await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    }

    const jsonContent = typeof content === 'object' ? JSON.stringify(content) : content;

    // Không nhận file_url tùy ý từ client; CV tạo online luôn có type = 'created' và file_url = NULL
    const [result] = await pool.query(
      `INSERT INTO cvs (candidate_id, title, type, content, file_url, is_default)
       VALUES (?, ?, 'created', ?, NULL, ?)`,
      [candidateId, title, jsonContent || null, is_default ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Tạo CV thành công',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('createCV error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo CV' });
  }
};

// PUT /api/candidates/cvs/:id
exports.updateCV = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.candidate_id;

    const [existing] = await pool.query('SELECT * FROM cvs WHERE id = ? AND candidate_id = ?', [id, candidateId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CV hoặc không có quyền' });
    }

    const { title, content, is_default } = req.body;

    if (is_default) {
      await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    }

    const jsonContent = typeof content === 'object' ? JSON.stringify(content) : content;

    // Giữ nguyên file_url gốc của hệ thống, không cho client ghi đè file_url tùy ý
    await pool.query(
      `UPDATE cvs
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           is_default = COALESCE(?, is_default)
       WHERE id = ?`,
      [title, jsonContent, is_default !== undefined ? (is_default ? 1 : 0) : null, id]
    );

    res.json({ success: true, message: 'Cập nhật CV thành công' });
  } catch (error) {
    console.error('updateCV error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật CV' });
  }
};

// DELETE /api/candidates/cvs/:id
exports.deleteCV = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.candidate_id;

    // Check CV existence and ownership first
    const [cvs] = await pool.query('SELECT * FROM cvs WHERE id = ?', [id]);
    if (cvs.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CV cần xóa' });
    }

    const cv = cvs[0];
    if (cv.candidate_id !== candidateId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa CV của ứng viên khác' });
    }

    // Check if CV is currently used in applications
    const [apps] = await pool.query('SELECT id FROM applications WHERE cv_id = ?', [id]);
    if (apps.length > 0) {
      return res.status(400).json({ success: false, message: 'CV này đã được dùng để ứng tuyển, không thể xóa' });
    }

    await pool.query('DELETE FROM cvs WHERE id = ?', [id]);

    // Xóa luôn file vật lý trên đĩa nếu là file upload. Nếu không tồn tại thì bỏ qua không báo lỗi
    if (cv.file_url && cv.file_url.startsWith('/uploads/cvs/')) {
      const filename = path.basename(cv.file_url);
      const filePath = path.join(__dirname, '../uploads/cvs', filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Không thể xóa file CV vật lý:', err.message);
      }
    }

    res.json({ success: true, message: 'Đã xóa CV thành công' });
  } catch (error) {
    console.error('deleteCV error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xóa CV' });
  }
};

// PATCH /api/candidates/cvs/:id/default
exports.setDefaultCV = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.candidate_id;

    await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    await pool.query('UPDATE cvs SET is_default = 1 WHERE id = ? AND candidate_id = ?', [id, candidateId]);

    res.json({ success: true, message: 'Đã đặt CV làm mặc định' });
  } catch (error) {
    console.error('setDefaultCV error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/candidates/cvs/upload (Upload CV PDF/Word file)
exports.uploadCVFile = async (req, res) => {
  try {
    const candidateId = req.user.candidate_id;
    if (!candidateId) {
      return res.status(403).json({ success: false, message: 'Chỉ ứng viên mới có thể tải lên CV' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp CV (PDF/Word) để tải lên' });
    }

    const title = req.body.title || req.file.originalname.replace(/\.[^/.]+$/, '');
    const isDefault = req.body.is_default === '1' || req.body.is_default === 'true' || req.body.is_default === 1;
    const fileUrl = `/uploads/cvs/${req.file.filename}`;

    if (isDefault) {
      await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    }

    const [result] = await pool.query(
      `INSERT INTO cvs (candidate_id, title, type, content, file_url, is_default)
       VALUES (?, ?, 'uploaded', NULL, ?, ?)`,
      [candidateId, title, fileUrl, isDefault ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: 'Tải lên tệp CV thành công!',
      data: {
        id: result.insertId,
        title,
        type: 'uploaded',
        file_url: fileUrl,
        is_default: isDefault ? 1 : 0
      }
    });
  } catch (error) {
    console.error('uploadCVFile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải lên CV' });
  }
};

// POST /api/candidates/upload-avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp hình ảnh' });
    }

    const fileUrl = `/uploads/images/${req.file.filename}`;
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'candidate') {
      await pool.query('UPDATE candidates SET avatar_url = ? WHERE user_id = ?', [fileUrl, userId]);
    } else if (role === 'company') {
      await pool.query('UPDATE companies SET logo_url = ? WHERE user_id = ?', [fileUrl, userId]);
    }

    res.json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công!',
      data: { url: fileUrl }
    });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tải lên hình ảnh' });
  }
};

// GET /uploads/cvs/:filename (Protected file delivery with access control)
exports.serveCVFile = async (req, res) => {
  try {
    // Yêu cầu xác thực qua header Authorization (middleware authenticate đã gắn req.user)
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tệp CV' });
    }

    const filename = path.basename(req.params.filename); // Chống path traversal
    const targetUrl = `/uploads/cvs/${filename}`;
    const filePath = path.join(__dirname, '../uploads/cvs', filename);

    // 1. So khớp CHÍNH XÁC file_url trong CSDL (không dùng LIKE)
    const [cvRows] = await pool.query('SELECT * FROM cvs WHERE file_url = ?', [targetUrl]);
    if (cvRows.length === 0) {
      // File không có bản ghi CV trong DB (đã bị xóa hoặc không hợp lệ) -> trả 404 kể cả với admin!
      return res.status(404).json({ success: false, message: 'Không tìm thấy tệp CV trên hệ thống' });
    }

    // 2. Kiểm tra file vật lý trên đĩa
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Tệp CV không tồn tại trên máy chủ' });
    }

    const cv = cvRows[0];

    // 3. Phân quyền truy cập tệp CV:
    // - Quản trị viên luôn có quyền xem
    if (req.user.role === 'admin') {
      return res.sendFile(filePath);
    }

    // - Ứng viên sở hữu CV có quyền xem
    if (req.user.role === 'candidate' && req.user.candidate_id === cv.candidate_id) {
      return res.sendFile(filePath);
    }

    // - Doanh nghiệp chỉ có quyền xem nếu ứng viên đã nộp CV này vào một tin của doanh nghiệp
    if (req.user.role === 'company' && req.user.company_id) {
      const [appRows] = await pool.query(
        `SELECT 1 FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE a.cv_id = ? AND j.company_id = ?
         LIMIT 1`,
        [cv.id, req.user.company_id]
      );
      if (appRows.length > 0) {
        return res.sendFile(filePath);
      }
    }

    // Không thuộc các quyền trên -> từ chối
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập hoặc xem tệp CV này' });
  } catch (error) {
    console.error('serveCVFile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi truy cập tệp CV' });
  }
};

