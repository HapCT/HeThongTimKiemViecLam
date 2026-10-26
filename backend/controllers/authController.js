const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firebase_uid: user.firebase_uid
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Get user profile details by ID
async function getUserFullProfile(userId) {
  const [users] = await pool.query(
    `SELECT u.id, u.firebase_uid, u.email, u.role, u.status, u.created_at,
            c.id AS candidate_id, c.full_name AS candidate_name, c.full_name, c.phone, c.birth_date, c.gender,
            c.address, c.university, c.major, c.graduation_year, c.gpa, c.bio, c.avatar_url,
            comp.id AS company_id, comp.name AS company_name, comp.name, comp.tax_code, comp.industry,
            comp.size, comp.address AS company_address, comp.website, comp.phone AS company_phone,
            comp.description AS company_description, comp.logo_url
     FROM users u
     LEFT JOIN candidates c ON u.id = c.user_id
     LEFT JOIN companies comp ON u.id = comp.user_id
     WHERE u.id = ?`,
    [userId]
  );
  return users[0] || null;
}

const bcrypt = require('bcryptjs');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim()]);
    const user = users[0];
    // Same message for unknown email and wrong password to avoid leaking which emails exist
    const match = user && user.password ? await bcrypt.compare(password, user.password) : false;
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên' });
    }

    const profile = await getUserFullProfile(user.id);
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      role = 'candidate',
      fullName,
      companyName,
      phone,
      university,
      major,
      taxCode,
      website,
      address
    } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Định dạng email không hợp lệ' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    if (!['candidate', 'company'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò đăng ký không hợp lệ' });
    }

    // 1. Kiểm tra email đã đăng ký chưa TRƯỚC KHI mở transaction
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã được đăng ký trong hệ thống' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const uid = 'uid_' + crypto.randomUUID();

    // 2. Mở transaction để tạo tài khoản người dùng và hồ sơ chi tiết
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [userResult] = await conn.query(
        'INSERT INTO users (firebase_uid, email, password, role, status) VALUES (?, ?, ?, ?, "active")',
        [uid, trimmedEmail, hashedPassword, role]
      );
      const userId = userResult.insertId;

      if (role === 'candidate') {
        await conn.query(
          'INSERT INTO candidates (user_id, full_name, phone, university, major) VALUES (?, ?, ?, ?, ?)',
          [userId, fullName || 'Sinh viên mới', phone || '', university || 'ĐH Sư phạm Kỹ thuật Hưng Yên', major || 'Công nghệ thông tin']
        );
      } else if (role === 'company') {
        await conn.query(
          'INSERT INTO companies (user_id, name, phone, tax_code, website, address) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, companyName || 'Doanh nghiệp mới', phone || '', taxCode || '', website || '', address || '']
        );
      }

      await conn.commit();

      const profile = await getUserFullProfile(userId);
      const token = generateToken(profile);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        data: { token, user: profile }
      });
    } catch (txError) {
      await conn.rollback();
      throw txError;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const profile = await getUserFullProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ người dùng' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'candidate') {
      const { full_name, phone, birth_date, gender, address, university, major, graduation_year, gpa, bio, avatar_url } = req.body;
      await pool.query(
        `UPDATE candidates
         SET full_name = COALESCE(?, full_name),
             phone = COALESCE(?, phone),
             birth_date = COALESCE(?, birth_date),
             gender = COALESCE(?, gender),
             address = COALESCE(?, address),
             university = COALESCE(?, university),
             major = COALESCE(?, major),
             graduation_year = COALESCE(?, graduation_year),
             gpa = COALESCE(?, gpa),
             bio = COALESCE(?, bio),
             avatar_url = COALESCE(?, avatar_url)
         WHERE user_id = ?`,
        [full_name, phone, birth_date || null, gender, address, university, major, graduation_year || null, gpa || null, bio, avatar_url, userId]
      );
    } else if (role === 'company') {
      const { name, tax_code, industry, size, address, website, phone, description, logo_url } = req.body;
      await pool.query(
        `UPDATE companies
         SET name = COALESCE(?, name),
             tax_code = COALESCE(?, tax_code),
             industry = COALESCE(?, industry),
             size = COALESCE(?, size),
             address = COALESCE(?, address),
             website = COALESCE(?, website),
             phone = COALESCE(?, phone),
             description = COALESCE(?, description),
             logo_url = COALESCE(?, logo_url)
         WHERE user_id = ?`,
        [name, tax_code, industry, size, address, website, phone, description, logo_url, userId]
      );
    }

    const updated = await getUserFullProfile(userId);
    res.json({ success: true, message: 'Cập nhật thông tin thành công', data: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật hồ sơ' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    const user = users[0];
    const match = currentPassword && user.password ? await bcrypt.compare(currentPassword, user.password) : false;
    if (!match) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ success: true, message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
  }
};
