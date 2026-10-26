require('dotenv').config();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

// Middleware authenticate token
async function authenticate(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    let userId = null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    // Fetch user details with candidate_id or company_id
    const [users] = await pool.query(
      `SELECT u.id, u.firebase_uid, u.email, u.role, u.status,
              c.id AS candidate_id, c.full_name AS candidate_name,
              comp.id AS company_id, comp.name AS company_name
       FROM users u
       LEFT JOIN candidates c ON u.id = c.user_id
       LEFT JOIN companies comp ON u.id = comp.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const user = users[0];
    if (user.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xác thực hệ thống' });
  }
}

// Optional authenticate (attaches user if present, otherwise continues)
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    let userId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    if (userId) {
      const [users] = await pool.query(
        `SELECT u.id, u.firebase_uid, u.email, u.role, u.status,
                c.id AS candidate_id, c.full_name AS candidate_name,
                comp.id AS company_id, comp.name AS company_name
         FROM users u
         LEFT JOIN candidates c ON u.id = c.user_id
         LEFT JOIN companies comp ON u.id = comp.user_id
         WHERE u.id = ?`,
        [userId]
      );
      if (users.length > 0 && users[0].status !== 'locked') {
        req.user = users[0];
      }
    }
    next();
  } catch (error) {
    next();
  }
}

// Role restriction
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện chức năng này' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  JWT_SECRET
};
