const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedAdminOnly() {
  console.log('========================================================================');
  console.log('     KHỞI TẠO CSDL BAN ĐẦU: 1 TÀI KHOẢN ADMIN DUY NHẤT (UTEHY)');
  console.log('     (Doanh nghiệp và Ứng viên sẽ được đăng ký động sau)');
  console.log('========================================================================\n');

  const conn = await pool.getConnection();

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE saved_jobs');
    await conn.query('TRUNCATE TABLE interviews');
    await conn.query('TRUNCATE TABLE applications');
    await conn.query('TRUNCATE TABLE payments');
    await conn.query('TRUNCATE TABLE notifications');
    await conn.query('TRUNCATE TABLE device_tokens');
    await conn.query('TRUNCATE TABLE cvs');
    await conn.query('TRUNCATE TABLE jobs');
    await conn.query('TRUNCATE TABLE candidates');
    await conn.query('TRUNCATE TABLE companies');
    await conn.query('TRUNCATE TABLE categories');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✓ Đã làm sạch các bảng dữ liệu');

    // 1. Categories
    const categories = [
      'Công nghệ thông tin',
      'Kinh tế - Tài chính',
      'Marketing & Truyền thông',
      'Thiết kế đồ họa & UI/UX',
      'Giáo dục & Đào tạo',
      'Kỹ thuật - Cơ điện tử'
    ];
    for (const cat of categories) {
      await conn.query('INSERT INTO categories (name) VALUES (?)', [cat]);
    }
    console.log(`✓ Đã nạp sẵn ${categories.length} danh mục ngành nghề`);

    // 2. ONLY 1 Admin account
    const adminPasswordHash = await bcrypt.hash('123456', 10);
    const [userRes] = await conn.query(
      `INSERT INTO users (id, firebase_uid, email, password, role, status)
       VALUES (1, 'admin_uid_utehy', 'admin@utehy.edu.vn', ?, 'admin', 'active')`,
      [adminPasswordHash]
    );
    console.log('✓ Đã tạo sẵn 1 tài khoản Quản trị viên duy nhất:');
    console.log('   - Email:    admin@utehy.edu.vn');
    console.log('   - Mật khẩu: 123456');
    console.log('   - Vai trò:  Quản trị viên (admin)');

    // 3. Welcome notification
    await conn.query(
      `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id)
       VALUES (1, NULL, 'Chào mừng Quản trị viên', 'Hệ thống tuyển dụng và thực tập UTEHY đã sẵn sàng. Doanh nghiệp và Ứng viên có thể tự do đăng ký tài khoản tham gia.', 'system', NULL)`
    );
    console.log('✓ Đã tạo thông báo khởi tạo hệ thống');

    console.log('\n========================================================================');
    console.log('HOÀN TẤT: CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA VỚI 1 TÀI KHOẢN ADMIN SẴN SÀNG!');
    console.log('Doanh nghiệp và Ứng viên sẽ trực tiếp tạo mới thông qua trang Đăng ký.');
    console.log('========================================================================');
  } catch (error) {
    console.error('Lỗi khởi tạo CSDL:', error);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedAdminOnly();
