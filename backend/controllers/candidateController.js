const { pool } = require('../config/db');

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
    res.json({ success: true, data: rows[0] });
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

    const { title, type = 'created', content, file_url, is_default = 0 } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên/tiêu đề CV' });
    }

    if (is_default) {
      await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    }

    const jsonContent = typeof content === 'object' ? JSON.stringify(content) : content;

    const [result] = await pool.query(
      `INSERT INTO cvs (candidate_id, title, type, content, file_url, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [candidateId, title, type, jsonContent || null, file_url || null, is_default ? 1 : 0]
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

    const { title, content, file_url, is_default } = req.body;

    if (is_default) {
      await pool.query('UPDATE cvs SET is_default = 0 WHERE candidate_id = ?', [candidateId]);
    }

    const jsonContent = typeof content === 'object' ? JSON.stringify(content) : content;

    await pool.query(
      `UPDATE cvs
       SET title = COALESCE(?, title),
           content = COALESCE(?, content),
           file_url = COALESCE(?, file_url),
           is_default = COALESCE(?, is_default)
       WHERE id = ?`,
      [title, jsonContent, file_url, is_default !== undefined ? (is_default ? 1 : 0) : null, id]
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

    // Check if CV is currently used in applications
    const [apps] = await pool.query('SELECT id FROM applications WHERE cv_id = ?', [id]);
    if (apps.length > 0) {
      return res.status(400).json({ success: false, message: 'CV này đã được dùng để ứng tuyển, không thể xóa' });
    }

    const [result] = await pool.query('DELETE FROM cvs WHERE id = ? AND candidate_id = ?', [id, candidateId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy CV cần xóa' });
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
