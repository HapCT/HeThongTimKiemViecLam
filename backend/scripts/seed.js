require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  console.log('=====================================================');
  console.log('  BẮT ĐẦU KHỞI TẠO DỮ LIỆU MẪU CHUẨN (SEED DATA)');
  console.log('=====================================================');

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) {
    console.error('❌ Lỗi: Biến môi trường SEED_PASSWORD chưa được thiết lập.');
    console.error('   Vui lòng định cấu hình SEED_PASSWORD trong file .env trước khi chạy seed.');
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'job_system';
  const hasYesFlag = process.argv.includes('--yes');
  console.log(`ℹ Cơ sở dữ liệu mục tiêu: [${dbName}]`);

  if (!hasYesFlag) {
    console.error('❌ Cảnh báo an toàn: Quá trình seed sẽ XÓA SẠCH toàn bộ dữ liệu hiện tại trong DB.');
    console.error('   Để xác nhận tiếp tục, vui lòng thêm cờ --yes (Ví dụ: npm run seed -- --yes)');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10);
  const conn = await pool.getConnection();

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE saved_jobs');
    await conn.query('TRUNCATE TABLE company_reviews');
    await conn.query('TRUNCATE TABLE interviews');
    await conn.query('TRUNCATE TABLE applications');
    await conn.query('TRUNCATE TABLE notifications');
    await conn.query('TRUNCATE TABLE cvs');
    await conn.query('TRUNCATE TABLE jobs');
    await conn.query('TRUNCATE TABLE candidates');
    await conn.query('TRUNCATE TABLE companies');
    await conn.query('TRUNCATE TABLE categories');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Làm sạch toàn bộ các bảng dữ liệu thành công');

    // 1. Categories
    const categories = [
      { id: 1, name: 'Công nghệ thông tin' },
      { id: 2, name: 'Kinh tế - Tài chính' },
      { id: 3, name: 'Marketing & Truyền thông' },
      { id: 4, name: 'Thiết kế đồ họa & UI/UX' },
      { id: 5, name: 'Giáo dục & Đào tạo' },
      { id: 6, name: 'Kỹ thuật - Cơ điện tử' }
    ];
    for (const cat of categories) {
      await conn.query('INSERT INTO categories (id, name) VALUES (?, ?)', [cat.id, cat.name]);
    }
    console.log(`✓ Đã thêm ${categories.length} danh mục ngành nghề`);

    // 2. Users (1 Admin, 5 Companies, 5 Candidates)
    const users = [
      // 1 Admin
      { id: 1, uid: 'uid_admin_01', email: 'admin@utehy.edu.vn', role: 'admin', status: 'active' },

      // 5 Companies
      { id: 2, uid: 'uid_comp_fpt', email: 'hr@fpt.com', role: 'company', status: 'active' },
      { id: 3, uid: 'uid_comp_viettel', email: 'hr@viettel.com.vn', role: 'company', status: 'active' },
      { id: 4, uid: 'uid_comp_vng', email: 'tuyendung@vng.com.vn', role: 'company', status: 'active' },
      { id: 5, uid: 'uid_comp_momo', email: 'careers@momo.vn', role: 'company', status: 'active' },
      { id: 6, uid: 'uid_comp_rikkei', email: 'career@rikkeisoft.com', role: 'company', status: 'active' },

      // 5 Candidates
      { id: 7, uid: 'uid_cand_huyanh', email: 'phamhuyanh44@gmail.com', role: 'candidate', status: 'active' },
      { id: 8, uid: 'uid_cand_an', email: 'nguyenvanan@utehy.edu.vn', role: 'candidate', status: 'active' },
      { id: 9, uid: 'uid_cand_mai', email: 'tranthimai@utehy.edu.vn', role: 'candidate', status: 'active' },
      { id: 10, uid: 'uid_cand_minh', email: 'lequangminh@utehy.edu.vn', role: 'candidate', status: 'active' },
      { id: 11, uid: 'uid_cand_thao', email: 'hoangthao@utehy.edu.vn', role: 'candidate', status: 'active' }
    ];

    for (const u of users) {
      await conn.query(
        'INSERT INTO users (id, firebase_uid, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [u.id, u.uid, u.email, hashedPassword, u.role, u.status]
      );
    }
    console.log(`✓ Đã thêm ${users.length} tài khoản người dùng có mật khẩu mã hóa bcrypt`);

    // 3. Companies Profile (5 công ty công nghệ đầu ngành)
    const companies = [
      {
        id: 1,
        user_id: 2,
        name: 'Công ty Cổ phần FPT (FPT Software)',
        tax_code: '0101248141',
        industry: 'Công nghệ thông tin / Phần mềm',
        size: '1000+ nhân viên',
        address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
        website: 'https://fptsoftware.com',
        phone: '02473007575',
        description: 'FPT Software là công ty chuyển đổi số hàng đầu Đông Nam Á, cung cấp dịch vụ công nghệ toàn cầu và mở rộng nhiều cơ hội thực tập, đào tạo bài bản cho sinh viên.',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/1200px-FPT_logo_2010.svg.png'
      },
      {
        id: 2,
        user_id: 3,
        name: 'Tổng Công ty Dịch vụ Số Viettel (Viettel Digital)',
        tax_code: '0100109106',
        industry: 'Viễn thông & Dịch vụ số',
        size: '1000+ nhân viên',
        address: 'Tòa nhà Viettel, Số 1 Trần Hữu Dực, Nam Từ Liêm, Hà Nội',
        website: 'https://viettel.vn',
        phone: '02462556789',
        description: 'Đơn vị tiên phong của Tập đoàn Công nghiệp - Viễn thông Quân đội trong phát triển hệ sinh thái tài chính số, dữ liệu lớn và an toàn thông tin.',
        logo_url: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Viettel-Teal.png'
      },
      {
        id: 3,
        user_id: 4,
        name: 'Công ty Cổ phần VNG (VNG Corporation)',
        tax_code: '0303493756',
        industry: 'Internet & Nền tảng số',
        size: '1000+ nhân viên',
        address: 'VNG Campus, Đường số 13, KCX Tân Thuận, Quận 7, TP. Hồ Chí Minh',
        website: 'https://vng.com.vn',
        phone: '02839623888',
        description: 'Kỳ lân công nghệ đầu tiên của Việt Nam với các sản phẩm hàng chục triệu người dùng: Zalo, ZaloPay, Zing MP3 cùng các tựa game nổi tiếng.',
        logo_url: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-VNG.png'
      },
      {
        id: 4,
        user_id: 5,
        name: 'Công ty Cổ phần Dịch vụ Di động Trực tuyến (MoMo)',
        tax_code: '0305094982',
        industry: 'Fintech & Ví điện tử',
        size: '500-1000 nhân viên',
        address: 'Tòa nhà Phú Mỹ Hưng, 08 Hoàng Văn Thái, Quận 7, TP. Hồ Chí Minh',
        website: 'https://momo.vn',
        phone: '02854145555',
        description: 'Siêu ứng dụng tài chính số hàng đầu Việt Nam, môi trường làm việc sáng tạo công nghệ cao, đón nhận hàng trăm thực tập sinh mỗi năm.',
        logo_url: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png'
      },
      {
        id: 5,
        user_id: 6,
        name: 'Công ty Cổ phần Rikkeisoft',
        tax_code: '0105844893',
        industry: 'Xuất khẩu phần mềm & Chuyển đổi số',
        size: '1000+ nhân viên',
        address: 'Tòa nhà Handico, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội',
        website: 'https://rikkeisoft.com',
        phone: '02436231685',
        description: 'Doanh nghiệp CNTT Việt Nam hàng đầu tại thị trường Nhật Bản và Hoa Kỳ, có nhiều trung tâm đào tạo lập trình viên chất lượng cao.',
        logo_url: 'https://cdn.haitrieu.com/wp-content/uploads/2022/03/Logo-Rikkeisoft-Blue.png'
      }
    ];

    for (const c of companies) {
      await conn.query(
        `INSERT INTO companies (id, user_id, name, tax_code, industry, size, address, website, phone, description, logo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.user_id, c.name, c.tax_code, c.industry, c.size, c.address, c.website, c.phone, c.description, c.logo_url]
      );
    }
    console.log(`✓ Đã thêm ${companies.length} hồ sơ doanh nghiệp`);

    // 4. Candidates Profile (5 sinh viên tiêu biểu trường UTEHY)
    const candidates = [
      {
        id: 1,
        user_id: 7,
        full_name: 'Phạm Huy Anh',
        phone: '0987654321',
        birth_date: '2004-05-15',
        gender: 'male',
        address: 'Khoái Châu, Hưng Yên',
        university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
        major: 'Công nghệ thông tin',
        graduation_year: 2026,
        gpa: 3.65,
        bio: 'Sinh viên năm cuối ngành CNTT, đam mê kiến trúc hệ thống và lập trình ứng dụng Full-Stack Web (Node.js, React). Mong muốn tìm kiếm cơ hội thực tập chuyên sâu tại các doanh nghiệp công nghệ lớn.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 2,
        user_id: 8,
        full_name: 'Nguyễn Văn An',
        phone: '0912345678',
        birth_date: '2004-08-20',
        gender: 'male',
        address: 'Mỹ Hào, Hưng Yên',
        university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
        major: 'Kỹ thuật phần mềm',
        graduation_year: 2026,
        gpa: 3.42,
        bio: 'Yêu thích lập trình Backend với Java Spring Boot và cơ sở dữ liệu quan hệ MySQL. Có khả năng tự nghiên cứu và làm việc nhóm hiệu quả.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 3,
        user_id: 9,
        full_name: 'Trần Thị Mai',
        phone: '0934567890',
        birth_date: '2004-11-10',
        gender: 'female',
        address: 'Gia Lâm, Hà Nội',
        university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
        major: 'Kinh tế - Tài chính số',
        graduation_year: 2026,
        gpa: 3.55,
        bio: 'Định hướng phát triển thành Chuyên viên phân tích nghiệp vụ (Business Analyst) hoặc Quản lý dự án công nghệ. Kỹ năng giao tiếp và phân tích dữ liệu tốt.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 4,
        user_id: 10,
        full_name: 'Lê Quang Minh',
        phone: '0945678901',
        birth_date: '2004-03-25',
        gender: 'male',
        address: 'Kim Động, Hưng Yên',
        university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
        major: 'An toàn thông tin & Mạng máy tính',
        graduation_year: 2026,
        gpa: 3.38,
        bio: 'Nghiên cứu về bảo mật ứng dụng Web, Cloud Security và quản trị hệ thống Linux. Đạt giải ba sinh viên nghiên cứu khoa học cấp trường.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
      },
      {
        id: 5,
        user_id: 11,
        full_name: 'Hoàng Thị Phương Thảo',
        phone: '0967890123',
        birth_date: '2004-12-05',
        gender: 'female',
        address: 'Bình Giang, Hải Dương',
        university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
        major: 'Thiết kế đồ họa & UI/UX',
        graduation_year: 2026,
        gpa: 3.70,
        bio: 'Đam mê thiết kế trải nghiệm người dùng, thành thạo Figma, Illustrator. Luôn hướng tới các giao diện tinh tế, hiện đại và chuẩn trải nghiệm.',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
      }
    ];

    for (const cand of candidates) {
      await conn.query(
        `INSERT INTO candidates (id, user_id, full_name, phone, birth_date, gender, address, university, major, graduation_year, gpa, bio, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cand.id, cand.user_id, cand.full_name, cand.phone, cand.birth_date, cand.gender, cand.address, cand.university, cand.major, cand.graduation_year, cand.gpa, cand.bio, cand.avatar_url]
      );
    }
    console.log(`✓ Đã thêm ${candidates.length} hồ sơ sinh viên UTEHY`);

    // 5. CVs (Tạo mẫu CV trực tuyến và CV tải lên)
    const cvs = [
      {
        id: 1,
        candidate_id: 1,
        title: 'CV Full-Stack Web Developer - Phạm Huy Anh',
        type: 'created',
        content: JSON.stringify({
          summary: 'Sinh viên CNTT có kinh nghiệm xây dựng các ứng dụng web thực tế sử dụng Node.js, Express, React và MySQL.',
          skills: ['JavaScript / TypeScript', 'React.js', 'Node.js / Express', 'MySQL / MongoDB', 'Git & Docker cơ bản'],
          education: 'Trường Đại học Sư phạm Kỹ thuật Hưng Yên - Chuyên ngành Công nghệ thông tin (GPA 3.65/4.0)',
          projects: [
            {
              name: 'Hệ thống tìm kiếm việc làm & thực tập sinh viên UTEHY',
              role: 'Full-Stack Developer',
              tech: 'React, Node.js, MySQL, RESTful API'
            }
          ]
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 2,
        candidate_id: 1,
        title: 'CV File PDF Chuẩn - Phạm Huy Anh',
        type: 'uploaded',
        content: null,
        file_url: '/uploads/cvs/cv_phamhuyanh_sample.pdf',
        is_default: 0
      },
      {
        id: 3,
        candidate_id: 2,
        title: 'CV Lập trình viên Java Backend - Nguyễn Văn An',
        type: 'created',
        content: JSON.stringify({
          summary: 'Kỹ sư phần mềm tập trung vào Java, Spring Boot, kiến trúc Microservices và REST API.',
          skills: ['Java', 'Spring Boot', 'Hibernate / JPA', 'MySQL', 'RESTful API'],
          education: 'ĐH Sư phạm Kỹ thuật Hưng Yên - Ngành Kỹ thuật phần mềm'
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 4,
        candidate_id: 3,
        title: 'CV Chuyên viên Phân tích Nghiệp vụ (BA) - Trần Thị Mai',
        type: 'created',
        content: JSON.stringify({
          summary: 'Đam mê kết nối bài toán kinh doanh với giải pháp công nghệ, thành thạo vẽ biểu đồ UML, BPMN và viết tài liệu SRS.',
          skills: ['Requirement Analysis', 'UML / BPMN', 'SQL Query', 'Figma Wireframing', 'Jira / Confluence'],
          education: 'ĐH Sư phạm Kỹ thuật Hưng Yên - Ngành Kinh tế số'
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 5,
        candidate_id: 4,
        title: 'CV An toàn thông tin & Kỹ thuật Mạng - Lê Quang Minh',
        type: 'created',
        content: JSON.stringify({
          summary: 'Kỹ sư an toàn mạng với kiến thức sâu về Web Vulnerabilities, OWASP Top 10 và Linux Administration.',
          skills: ['Network Security', 'OWASP Top 10', 'Linux Server', 'Burp Suite', 'Python Scripting'],
          education: 'ĐH Sư phạm Kỹ thuật Hưng Yên - Ngành An toàn thông tin'
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 6,
        candidate_id: 5,
        title: 'CV UI/UX Designer Portfolio - Hoàng Phương Thảo',
        type: 'created',
        content: JSON.stringify({
          summary: 'Nhà thiết kế trải nghiệm người dùng với tư duy lấy người dùng làm trung tâm, có sản phẩm thực tế trên Behance.',
          skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Design Systems', 'Usability Testing'],
          education: 'ĐH Sư phạm Kỹ thuật Hưng Yên - Ngành Thiết kế đồ họa'
        }),
        file_url: null,
        is_default: 1
      }
    ];

    for (const cv of cvs) {
      await conn.query(
        `INSERT INTO cvs (id, candidate_id, title, type, content, file_url, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [cv.id, cv.candidate_id, cv.title, cv.type, cv.content, cv.file_url, cv.is_default]
      );
    }
    console.log(`✓ Đã thêm ${cvs.length} hồ sơ CV sinh viên`);

    // 6. Jobs (15 tin tuyển dụng đa dạng, 12 approved, 3 pending để demo duyệt)
    const jobs = [
      {
        id: 1,
        company_id: 1, // FPT
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Full-Stack Web (Node.js & React)',
        description: 'Tham gia xây dựng các phân hệ trong giải pháp quản trị doanh nghiệp quy mô lớn. Làm việc trực tiếp với Tech Lead và Solution Architect để thiết kế REST API hiệu năng cao và phát triển giao diện người dùng hiện đại.',
        requirements: '• Sinh viên năm 3, năm cuối chuyên ngành CNTT hoặc Kỹ thuật phần mềm.\n• Nắm vững JavaScript / TypeScript, Node.js, Express và React.\n• Có hiểu biết về cơ sở dữ liệu quan hệ MySQL và Git workflow.',
        benefits: '• Trợ cấp thực tập cạnh tranh: 6.000.000 - 10.000.000 VNĐ / tháng.\n• Được ký xác nhận và hỗ trợ dấu thực tập đồ án tốt nghiệp.\n• Cơ hội đặc cách lên nhân viên chính thức sau 3 tháng.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 6000000,
        salary_max: 10000000,
        salary_negotiable: 0,
        quantity: 5,
        deadline: '2026-11-30',
        status: 'approved',
        view_count: 142
      },
      {
        id: 2,
        company_id: 1, // FPT
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Java / Spring Boot',
        description: 'Tham gia dự án gia công phần mềm cho thị trường tài chính ngân hàng quốc tế. Xây dựng dịch vụ Backend trên nền tảng Java 17, Spring Boot và kiến trúc Microservices.',
        requirements: '• Nắm chắc kiến thức lập trình hướng đối tượng (OOP) và ngôn ngữ Java.\n• Hiểu biết về Spring Framework, Spring Data JPA và RESTful API.\n• Ưu tiên ứng viên có tiếng Anh đọc hiểu tốt.',
        benefits: '• Trợ cấp: 6.000.000 - 9.000.000 VNĐ / tháng.\n• Đào tạo chứng chỉ chuyên môn quốc tế miễn phí.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 6000000,
        salary_max: 9000000,
        salary_negotiable: 0,
        quantity: 4,
        deadline: '2026-11-25',
        status: 'approved',
        view_count: 98
      },
      {
        id: 3,
        company_id: 1, // FPT
        category_id: 4, // UI/UX
        title: 'Thực tập sinh Thiết kế Giao diện UI/UX & Frontend',
        description: 'Nghiên cứu nhu cầu người dùng, lên wireframe và prototype tương tác cho các ứng dụng web nội bộ và khách hàng trên Figma.',
        requirements: '• Thành thạo Figma, nắm vững nguyên lý thiết kế Typography, Color Harmony.\n• Có khả năng dựng HTML/CSS cơ bản là lợi thế lớn.',
        benefits: '• Hướng dẫn 1-1 bởi Senior Product Designer.\n• Trợ cấp: 5.000.000 - 8.000.000 VNĐ / tháng.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 5000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-05',
        status: 'approved',
        view_count: 85
      },
      {
        id: 4,
        company_id: 2, // Viettel
        category_id: 1, // CNTT
        title: 'Thực tập sinh Kỹ sư Dữ liệu & AI Engineer',
        description: 'Tham gia xây dựng luồng dữ liệu (Data Pipeline), xử lý dữ liệu lớn (Big Data) và phát triển mô hình Machine Learning phục vụ phân tích hành vi khách hàng viễn thông.',
        requirements: '• Nắm vững Python, SQL và các thư viện Pandas, Scikit-learn.\n• Tư duy toán học và giải thuật tốt.',
        benefits: '• Môi trường công nghệ số quốc gia hàng đầu.\n• Trợ cấp hấp dẫn: 8.000.000 - 12.000.000 VNĐ / tháng.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 8000000,
        salary_max: 12000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-12-10',
        status: 'approved',
        view_count: 175
      },
      {
        id: 5,
        company_id: 2, // Viettel
        category_id: 1, // CNTT
        title: 'Thực tập sinh An toàn Thông tin (Cyber Security)',
        description: 'Tham gia đánh giá an ninh ứng dụng web (Penetration Testing), giám sát an toàn thông tin tại Trung tâm Điều hành SOC Viettel.',
        requirements: '• Hiểu biết về TCP/IP, Linux, các kỹ thuật tấn công OWASP Top 10.\n• Từng tham gia các giải đấu CTF là điểm cộng.',
        benefits: '• Trợ cấp: 7.000.000 - 11.000.000 VNĐ / tháng.\n• Được tiếp cận thiết bị phần cứng và lab thực hành chuyên biệt.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 7000000,
        salary_max: 11000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-11-28',
        status: 'approved',
        view_count: 130
      },
      {
        id: 6,
        company_id: 2, // Viettel
        category_id: 2, // Kinh tế
        title: 'Thực tập sinh Phân tích Nghiệp vụ Tài chính số (BA)',
        description: 'Khảo sát và tài liệu hóa quy trình nghiệp vụ ví điện tử Viettel Money, viết tài liệu đặc tả chức năng (SRS) cho đội ngũ phát triển phần mềm.',
        requirements: '• Sinh viên ngành Kinh tế, Hệ thống thông tin quản lý hoặc CNTT.\n• Kỹ năng phân tích logic và giao tiếp tốt.',
        benefits: '• Trợ cấp: 6.000.000 - 9.000.000 VNĐ / tháng.\n• Học hỏi nghiệp vụ thanh toán số và ngân hàng điện tử.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 6000000,
        salary_max: 9000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-01',
        status: 'approved',
        view_count: 67
      },
      {
        id: 7,
        company_id: 3, // VNG
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Di động (React Native / Flutter)',
        description: 'Tham gia phát triển các tính năng mới trên ứng dụng di động có hàng triệu người dùng, tối ưu hóa hiệu năng render và tích hợp Native Modules.',
        requirements: '• Có kinh nghiệm làm bài tập lớn hoặc dự án với React Native hoặc Flutter.\n• Nắm rõ Redux, Context API và RESTful API.',
        benefits: '• Trợ cấp: 7.000.000 - 11.000.000 VNĐ / tháng.\n• Bữa trưa miễn phí tại VNG Campus cùng khu thể thao gym, bơi lội.',
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 7000000,
        salary_max: 11000000,
        salary_negotiable: 0,
        quantity: 4,
        deadline: '2026-12-15',
        status: 'approved',
        view_count: 210
      },
      {
        id: 8,
        company_id: 3, // VNG
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Game (Unity / C#)',
        description: 'Lập trình gameplay, xử lý vật lý và tối ưu hóa tài nguyên đồ họa cho các sản phẩm game mobile 2D/3D.',
        requirements: '• Đam mê game, sử dụng thành thạo Unity Engine và C#.\n• Nắm vững kiến thức toán học hình học không gian và thuật toán đồ họa.',
        benefits: '• Trợ cấp: 7.000.000 - 10.000.000 VNĐ / tháng.\n• Môi trường làm việc đậm chất văn hóa game sáng tạo.',
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 7000000,
        salary_max: 10000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-11-20',
        status: 'approved',
        view_count: 115
      },
      {
        id: 9,
        company_id: 4, // MoMo
        category_id: 1, // CNTT
        title: 'Thực tập sinh Kỹ sư DevOps & Điện toán đám mây',
        description: 'Hỗ trợ tự động hóa luồng CI/CD với GitLab CI, quản lý cụm container Kubernetes trên hạ tầng AWS / GCP.',
        requirements: '• Thành thạo lệnh Linux, Docker, hiểu nguyên lý CI/CD.\n• Có tinh thần tự tìm hiểu các công nghệ Cloud mới.',
        benefits: '• Trợ cấp: 7.000.000 - 12.000.000 VNĐ / tháng.\n• Cơ hội thực chiến với hệ thống giao dịch thanh toán triệu request/phút.',
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 7000000,
        salary_max: 12000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-20',
        status: 'approved',
        view_count: 180
      },
      {
        id: 10,
        company_id: 4, // MoMo
        category_id: 3, // Marketing
        title: 'Thực tập sinh Tăng trưởng & Tiếp thị số (Growth Marketing)',
        description: 'Xây dựng kịch bản truyền thông, phối hợp triển khai các chiến dịch quà tặng, voucher khuyến mại trên ứng dụng MoMo.',
        requirements: '• Nhanh nhạy với xu hướng mạng xã hội, kỹ năng viết content sáng tạo.\n• Biết sử dụng các công cụ phân tích số liệu là lợi thế.',
        benefits: '• Trợ cấp: 5.000.000 - 8.000.000 VNĐ / tháng.\n• Làm việc trực tiếp với đội ngũ Growth Marketing hàng đầu thị trường.',
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 5000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-11-30',
        status: 'approved',
        view_count: 92
      },
      {
        id: 11,
        company_id: 5, // Rikkeisoft
        category_id: 1, // CNTT
        title: 'Thực tập sinh Frontend ReactJS / Next.js',
        description: 'Xây dựng giao diện web ứng dụng chất lượng cao, chuẩn responsive và tối ưu hóa SEO cho đối tác quốc tế.',
        requirements: '• Nắm chắc HTML5, CSS3, JavaScript ES6 và React Hooks.\n• Chăm chỉ, chịu khó học hỏi văn hóa kỹ thuật chuyên nghiệp.',
        benefits: '• Trợ cấp: 5.000.000 - 8.000.000 VNĐ / tháng.\n• Cơ hội đào tạo tiếng Nhật miễn phí và onsite tại Tokyo.',
        job_type: 'internship',
        location: 'Đà Nẵng',
        salary_min: 5000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 5,
        deadline: '2026-12-12',
        status: 'approved',
        view_count: 125
      },
      {
        id: 12,
        company_id: 5, // Rikkeisoft
        category_id: 6, // Kỹ thuật
        title: 'Thực tập sinh Lập trình Nhúng & Thiết bị IoT',
        description: 'Phát triển firmware cho vi điều khiển STM32, ESP32, lập trình giao tiếp cảm biến và gửi dữ liệu lên nền tảng IoT Cloud.',
        requirements: '• Sinh viên ngành Cơ điện tử, Kỹ thuật máy tính hoặc Điện tử viễn thông.\n• Lập trình thành thạo C/C++ cho vi điều khiển.',
        benefits: '• Trợ cấp: 6.000.000 - 9.000.000 VNĐ / tháng.\n• Trang bị đầy đủ kít phát triển và thiết bị đo kiểm hiện đại.',
        job_type: 'internship',
        location: 'Hưng Yên',
        salary_min: 6000000,
        salary_max: 9000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-11-29',
        status: 'approved',
        view_count: 108
      },

      // 3 TIN PENDING (Dành cho demo chức năng Admin kiểm duyệt tin)
      {
        id: 13,
        company_id: 1, // FPT
        category_id: 1, // CNTT
        title: 'Thực tập sinh Kiểm thử Phần mềm (QA / Automation Tester)',
        description: 'Viết kịch bản kiểm thử tự động với Selenium / Cypress, thực hiện kiểm thử chức năng và báo cáo lỗi trên Jira.',
        requirements: '• Cẩn thận, tỉ mỉ, hiểu rõ vòng đời phát triển phần mềm (SDLC).\n• Biết lập trình Java hoặc Python cơ bản.',
        benefits: '• Trợ cấp: 5.000.000 - 8.000.000 VNĐ / tháng.\n• Được cấp chứng chỉ ISTQB Foundation sau khóa đào tạo.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 5000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-12-15',
        status: 'pending',
        view_count: 12
      },
      {
        id: 14,
        company_id: 3, // VNG
        category_id: 4, // Thiết kế
        title: 'Thực tập sinh Họa sĩ 2D Concept Art & Game Asset',
        description: 'Thiết kế nhân vật, trang phục và bối cảnh cho các tựa game nhập vai 2D/3D theo định hướng từ Art Director.',
        requirements: '• Khả năng vẽ tay trên wacom tốt, thành thạo Photoshop / Clip Studio Paint.\n• Có portfolio tranh minh họa đính kèm.',
        benefits: '• Trợ cấp: 6.000.000 - 9.000.000 VNĐ / tháng.\n• Được ghi danh vào credit sản phẩm game chính thức.',
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 6000000,
        salary_max: 9000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-25',
        status: 'pending',
        view_count: 8
      },
      {
        id: 15,
        company_id: 5, // Rikkeisoft
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Hệ thống Go (Golang Developer)',
        description: 'Tham gia xây dựng các dịch vụ microservices backend hiệu năng cao, chịu tải lớn với ngôn ngữ Golang và gRPC.',
        requirements: '• Nắm chắc thuật toán, cấu trúc dữ liệu và lập trình mạng.\n• Từng viết code Golang hoặc C/C++.',
        benefits: '• Trợ cấp: 7.000.000 - 10.000.000 VNĐ / tháng.\n• Tiếp cận công nghệ tiên tiến đang rất khan hiếm nhân lực.',
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 7000000,
        salary_max: 10000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-12-20',
        status: 'pending',
        view_count: 15
      }
    ];

    for (const j of jobs) {
      await conn.query(
        `INSERT INTO jobs (id, company_id, category_id, title, description, requirements, benefits, job_type, location, salary_min, salary_max, salary_negotiable, quantity, deadline, status, view_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [j.id, j.company_id, j.category_id, j.title, j.description, j.requirements, j.benefits, j.job_type, j.location, j.salary_min, j.salary_max, j.salary_negotiable, j.quantity, j.deadline, j.status, j.view_count]
      );
    }
    console.log(`✓ Đã thêm ${jobs.length} tin tuyển dụng (12 approved, 3 pending để demo duyệt)`);

    // 7. Applications (Đơn ứng tuyển với các trạng thái khác nhau)
    const applications = [
      {
        id: 1,
        job_id: 1, // FPT Full-Stack
        candidate_id: 1, // Phạm Huy Anh
        cv_id: 1,
        cover_letter: 'Kính gửi Ban tuyển dụng FPT Software, em là Phạm Huy Anh, sinh viên năm cuối khoa CNTT trường ĐH Sư phạm Kỹ thuật Hưng Yên. Em rất hào hứng với vị trí Thực tập sinh Full-Stack Web và tin rằng kiến thức Node.js, React của mình sẽ đóng góp tốt vào dự án.',
        status: 'interview',
        note: 'Hồ sơ chuyên môn xuất sắc. Đã xếp lịch phỏng vấn chuyên môn vòng 1 qua Google Meet.'
      },
      {
        id: 2,
        job_id: 11, // Rikkeisoft Frontend
        candidate_id: 1, // Phạm Huy Anh
        cv_id: 2,
        cover_letter: 'Kính gửi Rikkeisoft, em ứng tuyển vị trí Thực tập sinh Frontend ReactJS. Em tự tin với kỹ năng xây dựng giao diện hiện đại chuẩn responsive.',
        status: 'accepted',
        note: 'Ứng viên đạt điểm số phỏng vấn xuất sắc. Ban nhân sự gửi thư tiếp nhận thực tập chính thức.'
      },
      {
        id: 3,
        job_id: 2, // FPT Java
        candidate_id: 2, // Nguyễn Văn An
        cv_id: 3,
        cover_letter: 'Kính gửi FPT Software, em là Nguyễn Văn An, sinh viên chuyên ngành Kỹ thuật phần mềm. Em đã hoàn thành một số dự án Spring Boot và rất mong muốn được thực tập tại công ty.',
        status: 'submitted',
        note: null
      },
      {
        id: 4,
        job_id: 6, // Viettel BA
        candidate_id: 3, // Trần Thị Mai
        cv_id: 4,
        cover_letter: 'Kính gửi Ban nhân sự Viettel Digital, em là Trần Thị Mai, sinh viên ngành Kinh tế số. Em có thế mạnh về phân tích quy trình và mô hình hóa dữ liệu.',
        status: 'viewed',
        note: 'Đã xem xét hồ sơ, đang đối chiếu với tiêu chí tuyển dụng của phòng Dịch vụ số.'
      },
      {
        id: 5,
        job_id: 5, // Viettel Cyber
        candidate_id: 4, // Lê Quang Minh
        cv_id: 5,
        cover_letter: 'Kính gửi Viettel Cyber Security, em là Lê Quang Minh, sinh viên chuyên ngành An toàn thông tin. Em rất mong có cơ hội thực tập và cống hiến cho công tác an ninh mạng quốc gia.',
        status: 'interview',
        note: 'Mời ứng viên tham gia phỏng vấn kỹ thuật trực tuyến.'
      },
      {
        id: 6,
        job_id: 3, // FPT UI/UX
        candidate_id: 5, // Hoàng Phương Thảo
        cv_id: 6,
        cover_letter: 'Kính gửi FPT Software, em là Hoàng Phương Thảo. Em xin gửi kèm CV và liên kết Portfolio thiết kế UI/UX trên Figma của em.',
        status: 'accepted',
        note: 'Portfolio có tính thẩm mỹ cao và chuẩn UX. Đồng ý tiếp nhận thực tập sinh.'
      },
      {
        id: 7,
        job_id: 7, // VNG Mobile
        candidate_id: 2, // Nguyễn Văn An
        cv_id: 3,
        cover_letter: 'Kính gửi VNG, em rất ấn tượng với hệ sinh thái ứng dụng của công ty và muốn thử sức ở vị trí lập trình di động.',
        status: 'rejected',
        note: 'Cảm ơn bạn đã quan tâm. Hiện tại yêu cầu kỹ thuật ưu tiên ứng viên có kinh nghiệm React Native chuyên sâu hơn.'
      }
    ];

    for (const app of applications) {
      await conn.query(
        `INSERT INTO applications (id, job_id, candidate_id, cv_id, cover_letter, status, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [app.id, app.job_id, app.candidate_id, app.cv_id, app.cover_letter, app.status, app.note]
      );
    }
    console.log(`✓ Đã thêm ${applications.length} đơn ứng tuyển`);

    // 8. Interviews (Lịch phỏng vấn liên kết với Application)
    const interviews = [
      {
        id: 1,
        application_id: 1, // Phạm Huy Anh -> FPT Full-Stack
        scheduled_at: '2026-11-05 09:30:00',
        format: 'online',
        location: 'https://meet.google.com/utehy-fpt-interview',
        note: 'Phỏng vấn kỹ thuật trực tuyến cùng Tech Lead FPT Software qua Google Meet. Ứng viên chuẩn bị máy tính có webcam và mic rõ ràng.',
        status: 'confirmed'
      },
      {
        id: 2,
        application_id: 5, // Lê Quang Minh -> Viettel Cyber
        scheduled_at: '2026-11-08 14:00:00',
        format: 'online',
        location: 'https://meet.google.com/viettel-cyber-interview',
        note: 'Trao đổi chuyên môn an toàn thông tin và định hướng đề tài thực tập tốt nghiệp.',
        status: 'scheduled'
      }
    ];

    for (const iv of interviews) {
      await conn.query(
        `INSERT INTO interviews (id, application_id, scheduled_at, format, location, note, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [iv.id, iv.application_id, iv.scheduled_at, iv.format, iv.location, iv.note, iv.status]
      );
    }
    console.log(`✓ Đã tạo ${interviews.length} lịch phỏng vấn trực tuyến`);

    // 9. Company Reviews (Đánh giá nhận xét môi trường thực tập)
    const reviews = [
      {
        company_id: 1, // FPT
        candidate_id: 1, // Phạm Huy Anh
        rating: 5,
        comment: 'Môi trường làm việc cực kỳ chuyên nghiệp, được các anh chị Senior hướng dẫn nhiệt tình và tham gia dự án thực tế quy mô lớn.'
      },
      {
        company_id: 1, // FPT
        candidate_id: 2, // Nguyễn Văn An
        rating: 4,
        comment: 'Chế độ phụ cấp thực tập sinh tốt, cơ sở vật chất văn phòng hiện đại, học hỏi được rất nhiều quy trình chuẩn quốc tế.'
      },
      {
        company_id: 2, // Viettel
        candidate_id: 4, // Lê Quang Minh
        rating: 5,
        comment: 'Hạ tầng công nghệ và bảo mật viễn thông đỉnh cao của Việt Nam. Được làm quen với các hệ thống phòng thủ mạng hiện đại.'
      },
      {
        company_id: 3, // VNG
        candidate_id: 3, // Trần Thị Mai
        rating: 5,
        comment: 'Khuôn viên VNG Campus đẹp như mơ, văn hóa cởi mở năng động, mọi người sẵn sàng hỗ trợ thực tập sinh hết mình.'
      },
      {
        company_id: 4, // MoMo
        candidate_id: 2, // Nguyễn Văn An
        rating: 5,
        comment: 'Công nghệ Fintech hiện đại, học được tư duy giải quyết bài toán tải lớn và kiến trúc dịch vụ thanh toán an toàn.'
      },
      {
        company_id: 5, // Rikkeisoft
        candidate_id: 5, // Hoàng Phương Thảo
        rating: 4,
        comment: 'Công ty tạo điều kiện tối đa cho sinh viên thực tập làm quen dự án và có cơ hội định hướng làm việc lâu dài.'
      }
    ];

    for (const r of reviews) {
      await conn.query(
        `INSERT INTO company_reviews (company_id, candidate_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [r.company_id, r.candidate_id, r.rating, r.comment]
      );
    }
    console.log(`✓ Đã thêm ${reviews.length} đánh giá doanh nghiệp`);

    // 10. Saved Jobs (Việc làm đã lưu)
    const savedJobs = [
      { candidate_id: 1, job_id: 4 }, // Huy Anh lưu Viettel AI
      { candidate_id: 1, job_id: 9 }, // Huy Anh lưu MoMo DevOps
      { candidate_id: 2, job_id: 1 }  // Văn An lưu FPT Full-Stack
    ];
    for (const s of savedJobs) {
      await conn.query(
        'INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)',
        [s.candidate_id, s.job_id]
      );
    }
    console.log(`✓ Đã thêm ${savedJobs.length} việc làm đã lưu của sinh viên`);

    // 11. Notifications (Thông báo mẫu hệ thống)
    const notifications = [
      {
        user_id: 7, // Phạm Huy Anh
        sender_id: 2, // FPT Software
        title: 'Lời mời phỏng vấn - FPT Software',
        body: 'FPT Software đã đặt lịch phỏng vấn vị trí "Thực tập sinh Lập trình Full-Stack Web" vào lúc 09:30 ngày 05/11/2026 qua Google Meet.',
        type: 'interview',
        ref_id: 1
      },
      {
        user_id: 7, // Phạm Huy Anh
        sender_id: 6, // Rikkeisoft
        title: 'Chúc mừng trúng tuyển thực tập - Rikkeisoft',
        body: 'Hồ sơ ứng tuyển của bạn đã được phê duyệt tiếp nhận thực tập vị trí Frontend ReactJS. Ban nhân sự sẽ liên hệ trao đổi chi tiết.',
        type: 'application',
        ref_id: 2
      },
      {
        user_id: 2, // FPT Software
        sender_id: 8, // Nguyễn Văn An
        title: 'Có hồ sơ ứng tuyển mới',
        body: 'Ứng viên Nguyễn Văn An vừa nộp đơn ứng tuyển vào tin "Thực tập sinh Lập trình Java / Spring Boot".',
        type: 'application',
        ref_id: 3
      },
      {
        user_id: 1, // Admin UTEHY
        sender_id: 2, // FPT
        title: 'Tin tuyển dụng mới đang chờ phê duyệt',
        body: 'Doanh nghiệp FPT Software vừa tạo tin tuyển dụng "Thực tập sinh Kiểm thử Phần mềm (QA / Automation Tester)". Vui lòng kiểm duyệt.',
        type: 'job',
        ref_id: 13
      }
    ];

    for (const n of notifications) {
      await conn.query(
        `INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id, is_read)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [n.user_id, n.sender_id, n.title, n.body, n.type, n.ref_id]
      );
    }
    console.log(`✓ Đã tạo ${notifications.length} thông báo mẫu hệ thống`);

    console.log('=====================================================');
    console.log('  KHỞI TẠO BỘ DỮ LIỆU MẪU THÀNH CÔNG RỰC RỠ!');
    console.log('=====================================================');
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', error);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
