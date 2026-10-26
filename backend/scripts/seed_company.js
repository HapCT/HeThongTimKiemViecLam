const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seedCompany() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check if hr@fpt.com exists
    const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', ['hr@fpt.com']);
    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      const hashed = await bcrypt.hash('123456', 10);
      await conn.query('UPDATE users SET password = ?, status = "active", role = "company" WHERE id = ?', [hashed, userId]);
      console.log('Updated existing user:', userId);
    } else {
      const hashed = await bcrypt.hash('123456', 10);
      const [uRes] = await conn.query(
        'INSERT INTO users (firebase_uid, email, password, role, status) VALUES (?, ?, ?, "company", "active")',
        ['uid_company_fpt_' + Date.now(), 'hr@fpt.com', hashed]
      );
      userId = uRes.insertId;
      console.log('Created new user:', userId);
    }

    // Insert or update company
    const [existingComp] = await conn.query('SELECT id FROM companies WHERE user_id = ?', [userId]);
    let companyId;
    if (existingComp.length > 0) {
      companyId = existingComp[0].id;
      await conn.query(
        `UPDATE companies SET 
          name = ?, 
          tax_code = ?, 
          industry = ?, 
          size = ?, 
          address = ?, 
          website = ?, 
          phone = ?, 
          description = ?, 
          logo_url = ? 
        WHERE id = ?`,
        [
          'CÔNG TY CỔ PHẦN FPT (FPT SOFTWARE)',
          '0101248141',
          'Công nghệ thông tin / Phần mềm',
          '1000+ nhân viên',
          'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
          'https://fptsoftware.com',
          '02473007575',
          'FPT Software là công ty công nghệ và chuyển đổi số hàng đầu Việt Nam, chuyên cung cấp giải pháp chuyển đổi số toàn cầu và tuyển dụng thực tập sinh công nghệ xuất sắc.',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/1200px-FPT_logo_2010.svg.png',
          companyId
        ]
      );
      console.log('Updated company:', companyId);
    } else {
      const [cRes] = await conn.query(
        `INSERT INTO companies (user_id, name, tax_code, industry, size, address, website, phone, description, logo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'CÔNG TY CỔ PHẦN FPT (FPT SOFTWARE)',
          '0101248141',
          'Công nghệ thông tin / Phần mềm',
          '1000+ nhân viên',
          'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
          'https://fptsoftware.com',
          '02473007575',
          'FPT Software là công ty công nghệ và chuyển đổi số hàng đầu Việt Nam, chuyên cung cấp giải pháp chuyển đổi số toàn cầu và tuyển dụng thực tập sinh công nghệ xuất sắc.',
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/1200px-FPT_logo_2010.svg.png'
        ]
      );
      companyId = cRes.insertId;
      console.log('Created company:', companyId);
    }

    // Insert sample jobs
    const [jobs] = await conn.query('SELECT id FROM jobs WHERE company_id = ?', [companyId]);
    let job1Id;
    if (jobs.length === 0) {
      const [j1Res] = await conn.query(
        `INSERT INTO jobs 
         (company_id, category_id, title, description, requirements, benefits, job_type, location, salary_min, salary_max, salary_negotiable, quantity, deadline, status)
         VALUES (?, 1, ?, ?, ?, ?, 'internship', ?, 6000000, 10000000, 0, 5, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'approved')`,
        [
          companyId,
          'Thực tập sinh Lập trình Full-Stack Web (Node.js & React)',
          'Tham gia phát triển các dự án Web ứng dụng doanh nghiệp thực tế. Phối hợp cùng các Senior Developer và Solution Architect thiết kế RESTful API, tối ưu hóa cơ sở dữ liệu MySQL và xây dựng giao diện React.',
          '• Sinh viên năm 3, 4 hoặc mới tốt nghiệp chuyên ngành CNTT, Kỹ thuật phần mềm (ưu tiên UTEHY).\n• Nắm vững kiến thức JavaScript, Node.js, Express và React.\n• Hiểu biết về cơ sở dữ liệu quan hệ MySQL / PostgreSQL.\n• Tinh thần ham học hỏi, chủ động và có trách nhiệm.',
          '• Trợ cấp thực tập cạnh tranh: 6.000.000 - 10.000.000 VNĐ / tháng.\n• Được cấp chứng nhận thực tập chính thức và dấu mộc xác nhận đồ án tốt nghiệp.\n• Cơ hội trở thành Nhân viên chính thức (Junior Developer) sau kỳ thực tập.\n• Tham gia các khóa đào tạo nội bộ và teambuilding công ty.',
          'Hà Nội'
        ]
      );
      job1Id = j1Res.insertId;

      await conn.query(
        `INSERT INTO jobs 
         (company_id, category_id, title, description, requirements, benefits, job_type, location, salary_min, salary_max, salary_negotiable, quantity, deadline, status)
         VALUES (?, 4, ?, ?, ?, ?, 'internship', ?, 5000000, 8000000, 0, 3, DATE_ADD(CURDATE(), INTERVAL 45 DAY), 'approved')`,
        [
          companyId,
          'Thực tập sinh Thiết kế UI/UX & Frontend Design',
          'Nghiên cứu trải nghiệm người dùng, thiết kế wireframe, prototype và design system trên Figma. Phối hợp với đội ngũ phát triển Frontend hiện thực hóa giao diện website chuẩn responsive.',
          '• Sử dụng thành thạo Figma, Adobe Photoshop / Illustrator.\n• Nắm bắt tư duy User-Centered Design, Design System.\n• Có hiểu biết cơ bản về HTML/CSS là lợi thế.',
          '• Trợ cấp: 5.000.000 - 8.000.000 VNĐ / tháng.\n• Hướng dẫn 1-1 bởi Lead Product Designer.\n• Môi trường làm việc trẻ trung, trang thiết bị hiện đại.',
          'Hà Nội'
        ]
      );
      console.log('Created sample jobs for company');
    } else {
      job1Id = jobs[0].id;
    }

    // Connect candidate application
    const [cands] = await conn.query('SELECT c.id AS candidate_id, cv.id AS cv_id FROM candidates c LEFT JOIN cvs cv ON c.id = cv.candidate_id LIMIT 1');
    if (cands.length > 0 && job1Id) {
      const { candidate_id, cv_id } = cands[0];
      const [appExists] = await conn.query('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?', [job1Id, candidate_id]);
      if (appExists.length === 0) {
        await conn.query(
          `INSERT INTO applications (job_id, candidate_id, cv_id, cover_letter, status)
           VALUES (?, ?, ?, ?, 'submitted')`,
          [
            job1Id,
            candidate_id,
            cv_id || 1,
            'Em chào Ban tuyển dụng FPT Software. Em là Phạm Huy Anh, sinh viên ngành Công nghệ thông tin trường ĐH Sư phạm Kỹ thuật Hưng Yên. Em rất mong muốn được ứng tuyển vào vị trí Thực tập sinh Full-Stack Web của công ty.'
          ]
        );
        console.log('Created application from candidate 1 to job 1');
      }
    }

    await conn.commit();
    console.log('SEEDING SUCCESSFUL!');
  } catch (err) {
    await conn.rollback();
    console.error('Seeding error:', err);
    throw err;
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedCompany();
