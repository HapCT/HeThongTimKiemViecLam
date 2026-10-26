const { pool } = require('../config/db');

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM jobs j WHERE j.category_id = c.id AND j.status = 'approved' AND j.is_deleted = 0) AS job_count
      FROM categories c
      ORDER BY c.id ASC
    `;
    const [rows] = await pool.query(sql);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên ngành nghề là bắt buộc' });
    }
    const cleanName = name.trim();
    // Kiểm tra xem ngành nghề đã tồn tại chưa (không phân biệt chữ hoa/thường)
    const [existing] = await pool.query('SELECT * FROM categories WHERE LOWER(TRIM(name)) = LOWER(?)', [cleanName]);
    if (existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Ngành nghề đã tồn tại trong hệ thống',
        data: existing[0],
        alreadyExists: true
      });
    }
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [cleanName]);
    res.status(201).json({
      success: true,
      message: 'Thêm ngành nghề thành công',
      data: { id: result.insertId, name: cleanName }
    });
  } catch (error) {
    console.error('createCategory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
    }
    await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('updateCategory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa ngành nghề' });
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
