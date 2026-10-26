const { pool } = require('../config/db');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `
      SELECT n.*,
             u.email AS sender_email,
             comp.name AS sender_company_name,
             cand.full_name AS sender_candidate_name
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN companies comp ON u.id = comp.user_id
      LEFT JOIN candidates cand ON u.id = cand.user_id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    const [rows] = await pool.query(sql, [userId]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
