const { pool } = require('../config/db');

async function seed() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu cho Job System ---');
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
    console.log(`✓ Đã thêm ${categories.length} ngành nghề danh mục`);

    // 2. Users
    // Admin, Candidates, Companies
    const users = [
      // 1: Admin
      { id: 1, uid: 'admin_uid_01', email: 'admin@utehy.edu.vn', role: 'admin', status: 'active' },
      // 2-4: Candidates
      { id: 2, uid: 'cand_uid_01', email: 'phamhuyanh@utehy.edu.vn', role: 'candidate', status: 'active' },
      { id: 3, uid: 'cand_uid_02', email: 'nguyenvanan@gmail.com', role: 'candidate', status: 'active' },
      { id: 4, uid: 'cand_uid_03', email: 'tranthimai@gmail.com', role: 'candidate', status: 'active' },
      // 5-9: Companies
      { id: 5, uid: 'comp_uid_01', email: 'hr@viettel.com.vn', role: 'company', status: 'active' },
      { id: 6, uid: 'comp_uid_02', email: 'recruitment@fsoft.com.vn', role: 'company', status: 'active' },
      { id: 7, uid: 'comp_uid_03', email: 'tuyendung@vng.com.vn', role: 'company', status: 'active' },
      { id: 8, uid: 'comp_uid_04', email: 'careers@momo.vn', role: 'company', status: 'active' },
      { id: 9, uid: 'comp_uid_05', email: 'career@rikkeisoft.com', role: 'company', status: 'active' }
    ];

    for (const u of users) {
      await conn.query(
        'INSERT INTO users (id, firebase_uid, email, role, status) VALUES (?, ?, ?, ?, ?)',
        [u.id, u.uid, u.email, u.role, u.status]
      );
    }
    console.log('✓ Đã thêm 9 tài khoản người dùng');

    // 3. Candidates Profile
    const candidates = [
      {
        id: 1,
        user_id: 2,
        full_name: 'Phạm Huy Anh',
        phone: '0987654321',
        birth_date: '2003-05-15',
        gender: 'male',
        address: 'Thành phố Hưng Yên / Cầu Giấy, Hà Nội',
        university: 'Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
        major: 'Kỹ thuật phần mềm (Software Engineering)',
        graduation_year: 2026,
        gpa: 3.65,
        bio: 'Sinh viên năm 4 chuyên ngành Kỹ thuật phần mềm UTEHY, đam mê phát triển hệ thống Web hiện đại (React/Node.js) và ứng dụng di động đa nền tảng (React Native Expo). Đã có kinh nghiệm tham gia các đồ án thực tế và BTL dịch vụ REST API.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 2,
        user_id: 3,
        full_name: 'Nguyễn Văn An',
        phone: '0912345678',
        birth_date: '2003-09-20',
        gender: 'male',
        address: 'Hà Nội',
        university: 'Đại học Bách Khoa Hà Nội',
        major: 'Công nghệ thông tin',
        graduation_year: 2025,
        gpa: 3.52,
        bio: 'Yêu thích lập trình Web frontend, chuyên sâu JavaScript/TypeScript và hệ sinh thái React, Next.js.',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 3,
        user_id: 4,
        full_name: 'Trần Thị Mai',
        phone: '0978112233',
        birth_date: '2004-02-10',
        gender: 'female',
        address: 'Hà Nội',
        university: 'Đại học Kinh tế Quốc dân (NEU)',
        major: 'Marketing kỹ thuật số',
        graduation_year: 2026,
        gpa: 3.75,
        bio: 'Có kinh nghiệm sáng tạo nội dung mạng xã hội, phân tích hành vi người dùng và quản trị chiến dịch quảng cáo.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
      }
    ];

    for (const c of candidates) {
      await conn.query(
        `INSERT INTO candidates (id, user_id, full_name, phone, birth_date, gender, address, university, major, graduation_year, gpa, bio, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.user_id, c.full_name, c.phone, c.birth_date, c.gender, c.address, c.university, c.major, c.graduation_year, c.gpa, c.bio, c.avatar_url]
      );
    }
    console.log('✓ Đã thêm hồ sơ ứng viên');

    // 4. Companies Profile
    const companies = [
      {
        id: 1,
        user_id: 5,
        name: 'Tập đoàn Công nghiệp - Viễn thông Quân đội (Viettel)',
        tax_code: '0100109106',
        industry: 'Viễn thông & Công nghệ thông tin',
        size: '10000+ nhân viên',
        address: 'Lô D26 Khu đô thị mới Cầu Giấy, Yên Hòa, Cầu Giấy, Hà Nội',
        website: 'https://viettel.vn',
        phone: '18008098',
        description: 'Tập đoàn Viễn thông hàng đầu Việt Nam, cung cấp các giải pháp số, viễn thông và dịch vụ công nghệ cao vươn tầm quốc tế.',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png'
      },
      {
        id: 2,
        user_id: 6,
        name: 'FPT Software (Công ty TNHH Phần mềm FPT)',
        tax_code: '0101601092',
        industry: 'Công nghệ thông tin & Chuyển đổi số',
        size: '5000-10000 nhân viên',
        address: 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
        website: 'https://fptsoftware.com',
        phone: '02473007575',
        description: 'Công ty công nghệ toàn cầu hàng đầu Việt Nam với mạng lưới chi nhánh tại hơn 30 quốc gia trên thế giới.',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/FPT_logo_2010.svg/1200px-FPT_logo_2010.svg.png'
      },
      {
        id: 3,
        user_id: 7,
        name: 'VNG Corporation',
        tax_code: '0303569874',
        industry: 'Internet & Trò chơi trực tuyến, Fintech',
        size: '1000-5000 nhân viên',
        address: 'VNG Campus, Đường số 13, Khu chế xuất Tân Thuận, Quận 7, TP.HCM',
        website: 'https://vng.com.vn',
        phone: '02839623888',
        description: 'Kỳ lân công nghệ đầu tiên của Việt Nam với các sản phẩm nổi tiếng: Zalo, ZaloPay, Zing, VNG Games.',
        logo_url: 'https://vng.com.vn/assets/images/logo_vng.svg'
      },
      {
        id: 4,
        user_id: 8,
        name: 'MoMo (Công ty Cổ phần Dịch vụ Di động Trực tuyến - M_Service)',
        tax_code: '0305289153',
        industry: 'Fintech & Thanh toán điện tử',
        size: '1000-5000 nhân viên',
        address: 'Tòa nhà Phú Mỹ Hưng, 08 Hoàng Văn Thái, Tân Phú, Quận 7, TP.HCM',
        website: 'https://momo.vn',
        phone: '1900545441',
        description: 'Ứng dụng siêu ví điện tử và tài chính thông minh phục vụ hơn 30 triệu người dùng tại Việt Nam.',
        logo_url: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png'
      },
      {
        id: 5,
        user_id: 9,
        name: 'Rikkeisoft (Công ty Cổ phần Rikkeisoft)',
        tax_code: '0105849842',
        industry: 'Gia công phần mềm & AI Robotics',
        size: '1000-5000 nhân viên',
        address: 'Tầng 21, Tòa nhà Handico, Đường Phạm Hùng, Nam Từ Liêm, Hà Nội',
        website: 'https://rikkeisoft.com',
        phone: '02436231685',
        description: 'Doanh nghiệp xuất khẩu phần mềm uy tín hàng đầu thị trường Nhật Bản và Hoa Kỳ.',
        logo_url: 'https://rikkeisoft.com/wp-content/themes/rikkeisoft-2022/assets/images/logo.svg'
      }
    ];

    for (const comp of companies) {
      await conn.query(
        `INSERT INTO companies (id, user_id, name, tax_code, industry, size, address, website, phone, description, logo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [comp.id, comp.user_id, comp.name, comp.tax_code, comp.industry, comp.size, comp.address, comp.website, comp.phone, comp.description, comp.logo_url]
      );
    }
    console.log('✓ Đã thêm thông tin 5 doanh nghiệp');

    // 5. CVs (Phạm Huy Anh has 2 CVs, An has 1, Mai has 1)
    const cvs = [
      {
        id: 1,
        candidate_id: 1,
        title: 'CV Kỹ sư Phần mềm Fullstack (React & Node.js)',
        type: 'created',
        content: JSON.stringify({
          fullName: 'Phạm Huy Anh',
          email: 'phamhuyanh@utehy.edu.vn',
          phone: '0987654321',
          objective: 'Tìm kiếm cơ hội thực tập và làm việc vị trí Lập trình viên Fullstack / Backend tại môi trường chuyên nghiệp, sẵn sàng đóng góp và tiếp thu công nghệ mới.',
          education: [
            { school: 'Đại học Sư phạm Kỹ thuật Hưng Yên', major: 'Kỹ thuật phần mềm', period: '2022 - 2026', gpa: '3.65/4.0' }
          ],
          skills: ['JavaScript / TypeScript', 'Node.js (Express)', 'React.js', 'React Native (Expo)', 'MySQL', 'Git / GitHub', 'RESTful API', 'Docker'],
          projects: [
            { name: 'Hệ thống tìm kiếm việc làm & thực tập cho sinh viên', role: 'Fullstack Developer', tech: 'React, React Native, Node.js, MySQL' },
            { name: 'Website Quản lý thuê máy ảnh số', role: 'Backend & Database Designer', tech: 'React, C# .NET / Node.js' }
          ],
          certificates: ['TOEIC 650', 'Chứng chỉ Agile/Scrum Foundation']
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 2,
        candidate_id: 1,
        title: 'CV Chuyên viên Phát triển Ứng dụng Mobile React Native',
        type: 'created',
        content: JSON.stringify({
          fullName: 'Phạm Huy Anh',
          email: 'phamhuyanh@utehy.edu.vn',
          phone: '0987654321',
          objective: 'Phát triển ứng dụng di động đa nền tảng chất lượng cao trên iOS & Android bằng React Native / Expo.',
          skills: ['React Native', 'Expo Router', 'Mobile UI Design', 'State Management', 'REST API Integration'],
          education: [{ school: 'ĐH Sư phạm Kỹ thuật Hưng Yên', major: 'Kỹ thuật phần mềm', gpa: '3.65' }]
        }),
        file_url: null,
        is_default: 0
      },
      {
        id: 3,
        candidate_id: 2,
        title: 'CV Frontend Developer - Nguyễn Văn An',
        type: 'created',
        content: JSON.stringify({
          fullName: 'Nguyễn Văn An',
          email: 'nguyenvanan@gmail.com',
          phone: '0912345678',
          objective: 'Thực tập sinh Lập trình Web Frontend',
          skills: ['HTML5/CSS3', 'JavaScript ES6+', 'React.js', 'TailwindCSS']
        }),
        file_url: null,
        is_default: 1
      },
      {
        id: 4,
        candidate_id: 3,
        title: 'CV Marketing Specialist - Trần Thị Mai',
        type: 'created',
        content: JSON.stringify({
          fullName: 'Trần Thị Mai',
          email: 'tranthimai@gmail.com',
          phone: '0978112233',
          objective: 'Thực tập sinh Digital Marketing & Truyền thông',
          skills: ['Content Writing', 'SEO/SEM', 'Social Media Analytics', 'Canva/Photoshop']
        }),
        file_url: null,
        is_default: 1
      }
    ];

    for (const cv of cvs) {
      await conn.query(
        'INSERT INTO cvs (id, candidate_id, title, type, content, file_url, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cv.id, cv.candidate_id, cv.title, cv.type, cv.content, cv.file_url, cv.is_default]
      );
    }
    console.log('✓ Đã thêm CV ứng viên');

    // 6. Jobs
    const jobs = [
      {
        id: 1,
        company_id: 2, // FPT Software
        category_id: 1, // CNTT
        title: 'Thực tập sinh Node.js / Backend Developer (Trợ cấp lên tới 8M)',
        description: `FPT Software tìm kiếm các bạn sinh viên năm 3, năm 4 hoặc mới tốt nghiệp có nền tảng tốt về lập trình Backend với Node.js / JavaScript.
- Tham gia các dự án phát triển hệ thống microservices cho khách hàng quốc tế.
- Được đào tạo bài bản quy trình Agile/Scrum chuyên nghiệp và code review cùng Senior Architects.
- Hỗ trợ tài liệu và dấu thực tập tốt nghiệp.`,
        requirements: `- Sinh viên chuyên ngành CNTT, Kỹ thuật phần mềm hoặc ngành liên quan.
- Nắm vững kiến thức nền tảng về JavaScript/TypeScript, HTTP Protocol, REST API.
- Có hiểu biết về Node.js (Express hoặc NestJS) và cơ sở dữ liệu quan hệ (MySQL/PostgreSQL).
- Tinh thần ham học hỏi, chủ động và tư duy giải quyết vấn đề tốt.`,
        benefits: `- Mức trợ cấp thực tập hấp dẫn: 4.000.000 - 8.000.000 VNĐ/tháng.
- Cơ hội trở thành nhân viên chính thức (Fresher) sau 2-3 tháng thực tập.
- Tham gia các hoạt động ngoại khóa, câu lạc bộ, teambuilding tại FPT Complex.
- Làm việc trong môi trường năng động, trang thiết bị hiện đại.`,
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 4000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 5,
        deadline: '2026-11-30',
        status: 'approved',
        view_count: 142
      },
      {
        id: 2,
        company_id: 5, // Rikkeisoft
        category_id: 1, // CNTT
        title: 'Thực tập sinh Lập trình Web Frontend (ReactJS / TypeScript)',
        description: `Rikkeisoft mở đợt tuyển dụng Thực tập sinh Frontend tài năng gia nhập bộ phận phát triển giải pháp Web Enterprise.
- Tham gia xây dựng giao diện ứng dụng Web bằng ReactJS, Redux Toolkit, Ant Design / Tailwind.
- Phối hợp với UI/UX Designer và Backend team để tối ưu hóa trải nghiệm người dùng.`,
        requirements: `- Nắm chắc HTML5, CSS3, JavaScript (ES6+).
- Đã từng làm đồ án sử dụng React.js hoặc có sản phẩm demo cụ thể trên GitHub.
- Hiểu biết về Responsive Web Design, Git version control.`,
        benefits: `- Trợ cấp thực tập: 5.000.000 - 9.000.000 VNĐ/tháng theo năng lực.
- Lộ trình đào tạo 1-1 với Tech Lead giàu kinh nghiệm.
- Hỗ trợ mộc và nhận xét báo cáo đồ án tốt nghiệp.`,
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 5000000,
        salary_max: 9000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-12-15',
        status: 'approved',
        view_count: 98
      },
      {
        id: 3,
        company_id: 1, // Viettel
        category_id: 1, // CNTT
        title: 'Fresher Mobile App Developer (React Native / Flutter)',
        description: `Gia nhập Trung tâm Giải pháp Số Viettel để tham gia phát triển các ứng dụng di động phục vụ hàng chục triệu khách hàng trên nền tảng React Native.
- Xây dựng các module, màn hình chức năng tối ưu hiệu năng.
- Tích hợp các SDK thanh toán, push notification, camera, biometric.`,
        requirements: `- Tốt nghiệp hoặc sắp tốt nghiệp Đại học ngành CNTT, Kỹ thuật máy tính.
- Thành thạo React Native (Expo/CLI) hoặc Flutter.
- Đam mê thiết kế trải nghiệm người dùng mượt mà, hiểu rõ chu kỳ vòng đời ứng dụng di động.`,
        benefits: `- Thu nhập cạnh tranh: 10.000.000 - 18.000.000 VNĐ/tháng.
- Chế độ đãi ngộ quân đội, bảo hiểm sức khỏe toàn diện Viettel Care.
- Môi trường nghiên cứu làm chủ công nghệ lõi lớn nhất Việt Nam.`,
        job_type: 'full_time',
        location: 'Hà Nội',
        salary_min: 10000000,
        salary_max: 18000000,
        salary_negotiable: 0,
        quantity: 4,
        deadline: '2026-11-20',
        status: 'approved',
        view_count: 215
      },
      {
        id: 4,
        company_id: 3, // VNG
        category_id: 1, // CNTT
        title: 'Thực tập sinh Phân tích Dữ liệu / Data Analyst Intern',
        description: `VNG Data Team tuyển dụng thực tập sinh tham gia trích xuất, trực quan hóa và khai phá dữ liệu người dùng nhằm tối ưu hóa các dòng sản phẩm trò chơi và tiện ích số.
- Viết truy vấn SQL xử lý các tập dữ liệu lớn.
- Xây dựng dashboard báo cáo trên Power BI / Tableau.`,
        requirements: `- Sinh viên năm cuối ngành Khoa học máy tính, Hệ thống thông tin, Toán tin.
- Sử dụng thành thạo SQL và Python / R cơ bản.
- Tư duy logic mạnh mẽ, kỹ năng giao tiếp và thuyết trình dữ liệu tốt.`,
        benefits: `- Trợ cấp: 6.000.000 - 10.000.000 VNĐ/tháng.
- Bữa ăn trưa miễn phí tại VNG Campus cùng khu vui chơi, gym, hồ bơi hiện đại.
- Cơ hội được ký hợp đồng chính thức sau kỳ thực tập.`,
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 6000000,
        salary_max: 10000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-01',
        status: 'approved',
        view_count: 176
      },
      {
        id: 5,
        company_id: 4, // MoMo
        category_id: 3, // Marketing
        title: 'Thực tập sinh Social Media & Content Creator',
        description: `Đội ngũ Marketing MoMo tìm kiếm các bạn trẻ năng động, sáng tạo và thấu hiểu phong cách giới trẻ Gen Z để xây dựng nội dung viral cho ứng dụng MoMo.
- Lên kịch bản video TikTok, Reels và bài viết Facebook Fanpage.
- Theo dõi các xu hướng nóng hổi và đề xuất ý tưởng tương tác người dùng.`,
        requirements: `- Sinh viên chuyên ngành Marketing, Báo chí, Truyền thông, Quan hệ công chúng.
- Kỹ năng viết lách tốt, bắt trend nhanh nhạy.
- Ưu tiên ứng viên biết quay dựng video CapCut / Premiere cơ bản.`,
        benefits: `- Trợ cấp: 4.000.000 - 7.000.000 VNĐ/tháng.
- Làm việc trong môi trường Fintech trẻ trung, sáng tạo bậc nhất.
- Hỗ trợ máy tính làm việc và đào tạo kỹ năng chuyên sâu.`,
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 4000000,
        salary_max: 7000000,
        salary_negotiable: 0,
        quantity: 3,
        deadline: '2026-11-25',
        status: 'approved',
        view_count: 85
      },
      {
        id: 6,
        company_id: 3, // VNG
        category_id: 4, // Thiết kế
        title: 'Thực tập sinh Thiết kế UI/UX Sản phẩm Di động',
        description: `Cùng đội ngũ Product Design tại VNG kiến tạo giao diện và trải nghiệm tinh tế cho hàng triệu người dùng ứng dụng di động.
- Thiết kế Wireframe, Prototype và Design System trên Figma.
- Phỏng vấn người dùng và đo lường trải nghiệm tương tác (Usability Testing).`,
        requirements: `- Có portfolio các sản phẩm UI/UX (Figma / Behance / Dribbble).
- Hiểu biết về nguyên lý thiết kế đồ họa, typography, color scheme.
- Tư duy hướng về người dùng và khả năng tiếp thu góp ý thiết kế.`,
        benefits: `- Trợ cấp: 5.000.000 - 8.000.000 VNĐ/tháng.
- Môi trường thiết kế chuẩn quốc tế cùng dàn Lead Designer xuất sắc.`,
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 5000000,
        salary_max: 8000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-10',
        status: 'approved',
        view_count: 110
      },
      {
        id: 7,
        company_id: 1, // Viettel
        category_id: 2, // Kinh tế - Tài chính
        title: 'Thực tập sinh Quản trị Tài chính & Phân tích Đầu tư',
        description: `Hỗ trợ ban Tài chính Viettel trong công tác kiểm soát số liệu tài chính doanh nghiệp, lập báo cáo dòng tiền và thẩm định các dự án chuyển đổi số.`,
        requirements: `- Sinh viên năm 4 ngành Tài chính - Ngân hàng, Kế toán, Kiểm toán.
- GPA từ 3.2 trở lên, tiếng Anh khá (IELTS 6.0 hoặc tương đương).`,
        benefits: `- Trợ cấp: 4.500.000 - 7.500.000 VNĐ/tháng.
- Chứng chỉ hoàn thành kỳ thực tập tại Tập đoàn Viettel danh giá.`,
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 4500000,
        salary_max: 7500000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-11-15',
        status: 'approved',
        view_count: 65
      },
      {
        id: 8,
        company_id: 4, // MoMo
        category_id: 1, // CNTT
        title: 'Thực tập sinh DevOps & Cloud Engineer (AWS / Kubernetes)',
        description: `Tham gia vận hành và tự động hóa hạ tầng đám mây cho hệ thống giao dịch thanh toán triệu lượt request/giây của MoMo.
- Viết CI/CD pipeline, tự động kiểm thử và deploy container.
- Giám sát hệ thống bằng Prometheus, Grafana, ELK stack.`,
        requirements: `- Sinh viên CNTT, ATTT hoặc Mạng máy tính.
- Nắm chắc hệ điều hành Linux, Docker và script shell (Bash/Python).`,
        benefits: `- Trợ cấp: 6.000.000 - 10.000.000 VNĐ/tháng.
- Trải nghiệm quy mô hạ tầng lớn và tiêu chuẩn bảo mật PCI-DSS hàng đầu.`,
        job_type: 'internship',
        location: 'TP. Hồ Chí Minh',
        salary_min: 6000000,
        salary_max: 10000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-20',
        status: 'pending', // Tin chờ duyệt
        view_count: 32
      },
      {
        id: 9,
        company_id: 5, // Rikkeisoft
        category_id: 1, // CNTT
        title: 'Thực tập sinh AI / Machine Learning (Computer Vision)',
        description: `Rikkei AI Lab tuyển dụng thực tập sinh nghiên cứu và triển khai mô hình học máy ứng dụng trong nhận diện khuôn mặt, trích xuất hóa đơn tự động (OCR).`,
        requirements: `- Nắm vững Python, PyTorch hoặc TensorFlow.
- Hiểu biết các kiến trúc mạng CNN, Transformer là lợi thế.`,
        benefits: `- Trợ cấp: 6.000.000 - 12.000.000 VNĐ/tháng.
- Tham gia các đề tài nghiên cứu công bố bài báo quốc tế.`,
        job_type: 'internship',
        location: 'Hà Nội',
        salary_min: 6000000,
        salary_max: 12000000,
        salary_negotiable: 0,
        quantity: 2,
        deadline: '2026-12-30',
        status: 'pending', // Tin chờ duyệt
        view_count: 45
      }
    ];

    for (const j of jobs) {
      await conn.query(
        `INSERT INTO jobs (id, company_id, category_id, title, description, requirements, benefits, job_type, location, salary_min, salary_max, salary_negotiable, quantity, deadline, status, view_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [j.id, j.company_id, j.category_id, j.title, j.description, j.requirements, j.benefits, j.job_type, j.location, j.salary_min, j.salary_max, j.salary_negotiable, j.quantity, j.deadline, j.status, j.view_count]
      );
    }
    console.log('✓ Đã thêm 9 tin tuyển dụng đa dạng');

    // 7. Saved Jobs (Phạm Huy Anh saves Job 1 & Job 3)
    await conn.query('INSERT INTO saved_jobs (candidate_id, job_id) VALUES (1, 1), (1, 3)');
    console.log('✓ Đã thêm việc làm yêu thích');

    // 8. Applications
    // Candidate 1 applies to Job 1 (FPT) -> status: 'interview'
    // Candidate 1 applies to Job 2 (Rikkeisoft) -> status: 'accepted'
    // Candidate 2 applies to Job 3 (Viettel) -> status: 'submitted'
    const applications = [
      {
        id: 1,
        job_id: 1,
        candidate_id: 1,
        cv_id: 1,
        cover_letter: 'Kính gửi Quý công ty FPT Software, em là Phạm Huy Anh, sinh viên năm 4 ngành Kỹ thuật phần mềm UTEHY. Em rất yêu thích các giải pháp công nghệ của FPT và mong muốn được cống hiến ở vị trí Thực tập sinh Node.js.',
        status: 'interview',
        note: 'Ứng viên có kiến thức tốt, đồ án thực tế hoàn thiện. Đã lên lịch phỏng vấn chuyên môn.',
        applied_at: new Date('2026-10-08 09:30:00')
      },
      {
        id: 2,
        job_id: 2,
        candidate_id: 1,
        cv_id: 1,
        cover_letter: 'Kính gửi Rikkeisoft, em xin ứng tuyển vị trí Thực tập sinh Frontend ReactJS. Em đã có kinh nghiệm thực tế với React, Ant Design và tích hợp REST API.',
        status: 'accepted',
        note: 'Hồ sơ xuất sắc, phỏng vấn đạt yêu cầu. Đồng ý tiếp nhận thực tập từ ngày 01/11/2026.',
        applied_at: new Date('2026-10-05 14:15:00')
      },
      {
        id: 3,
        job_id: 3,
        candidate_id: 2,
        cv_id: 3,
        cover_letter: 'Em mong muốn được thử sức với môi trường công nghệ viễn thông quy mô lớn tại Viettel.',
        status: 'submitted',
        note: null,
        applied_at: new Date('2026-10-10 10:00:00')
      }
    ];

    for (const app of applications) {
      await conn.query(
        `INSERT INTO applications (id, job_id, candidate_id, cv_id, cover_letter, status, note, applied_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [app.id, app.job_id, app.candidate_id, app.cv_id, app.cover_letter, app.status, app.note, app.applied_at]
      );
    }
    console.log('✓ Đã thêm 3 đơn ứng tuyển');

    // 9. Interviews (for Application 1)
    await conn.query(
      `INSERT INTO interviews (id, application_id, scheduled_at, format, location, note, status)
       VALUES (1, 1, '2026-10-15 09:30:00', 'online', 'https://meet.google.com/utehy-fpt-interview', 'Phỏng vấn kỹ thuật và trao đổi kế hoạch thực tập qua Google Meet cùng Tech Lead FPT', 'scheduled')`
    );
    console.log('✓ Đã tạo lịch phỏng vấn');

    // 10. Notifications
    const notifications = [
      {
        user_id: 2, // Phạm Huy Anh
        sender_id: 6, // FPT Software
        title: 'Lời mời phỏng vấn - FPT Software',
        body: 'FPT Software đã đặt lịch phỏng vấn vị trí Thực tập sinh Node.js vào lúc 09:30 ngày 15/10/2026 qua Google Meet.',
        type: 'interview',
        ref_id: 1
      },
      {
        user_id: 2, // Phạm Huy Anh
        sender_id: 9, // Rikkeisoft
        title: 'Chúc mừng bạn đã trúng tuyển thực tập tại Rikkeisoft',
        body: 'Hồ sơ ứng tuyển của bạn đã được phê duyệt tiếp nhận thực tập vị trí Frontend Developer. Vui lòng kiểm tra email để nhận hướng dẫn onboard.',
        type: 'application',
        ref_id: 2
      },
      {
        user_id: 6, // FPT Software
        sender_id: 2,
        title: 'Có hồ sơ ứng tuyển mới',
        body: 'Ứng viên Phạm Huy Anh vừa nộp hồ sơ ứng tuyển vào tin: Thực tập sinh Node.js / Backend Developer.',
        type: 'application',
        ref_id: 1
      },
      {
        user_id: 1, // Admin
        sender_id: 8, // MoMo
        title: 'Tin tuyển dụng mới đang chờ duyệt',
        body: 'Doanh nghiệp MoMo vừa tạo tin tuyển dụng mới: "Thực tập sinh DevOps & Cloud Engineer". Vui lòng kiểm duyệt.',
        type: 'job',
        ref_id: 8
      }
    ];

    for (const n of notifications) {
      await conn.query(
        'INSERT INTO notifications (user_id, sender_id, title, body, type, ref_id, is_read) VALUES (?, ?, ?, ?, ?, ?, 0)',
        [n.user_id, n.sender_id, n.title, n.body, n.type, n.ref_id]
      );
    }
    console.log('✓ Đã tạo các thông báo hệ thống');

    console.log('=== KHỞI TẠO DỮ LIỆU MẪU THÀNH CÔNG RỰC RỠ! ===');
  } catch (err) {
    console.error('Lỗi khi seed dữ liệu:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seed();
