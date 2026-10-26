/**
 * TopCV-style CV PDF Exporter & Printable Template
 * Formats candidate CV into an elegant, standard A4 CV layout and triggers native print-to-PDF
 */

export function parseCVData(cv, extraInfo = {}) {
  let content = {};
  const rawContent = cv?.content || cv?.cv_content;

  if (rawContent) {
    if (typeof rawContent === 'object') {
      content = rawContent;
    } else {
      try {
        content = JSON.parse(rawContent);
      } catch (e) {
        content = {};
      }
    }
  }

  const fullName =
    content.fullName ||
    cv?.candidate_name ||
    extraInfo.fullName ||
    extraInfo.candidate_name ||
    'Ứng Viên UTEHY';

  const title =
    cv?.title ||
    cv?.cv_title ||
    extraInfo.title ||
    'CV Ứng Tuyển Vị Trí Thực Tập';

  const email =
    content.email ||
    cv?.candidate_email ||
    extraInfo.email ||
    '';

  const phone =
    content.phone ||
    cv?.candidate_phone ||
    extraInfo.phone ||
    '';

  const university =
    content.university ||
    cv?.university ||
    (content.education && content.education[0]?.school) ||
    'Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)';

  const major =
    content.major ||
    (content.education && content.education[0]?.major) ||
    'Công nghệ thông tin / Kỹ thuật phần mềm';

  const gpa =
    content.gpa ||
    cv?.gpa ||
    (content.education && content.education[0]?.gpa) ||
    '';

  const objective =
    content.objective ||
    'Mong muốn áp dụng các kiến thức và kỹ năng đã học vào môi trường thực tế, học hỏi quy trình phát triển dự án chuyên nghiệp và đóng góp giá trị cho sự phát triển của doanh nghiệp.';

  const education = Array.isArray(content.education) && content.education.length > 0
    ? content.education
    : [
        {
          school: university,
          major: major,
          gpa: gpa,
          period: '2021 - 2025'
        }
      ];

  const skills = Array.isArray(content.skills) && content.skills.length > 0
    ? content.skills
    : ['JavaScript', 'ReactJS', 'Node.js', 'MySQL', 'Git / GitHub', 'Giao tiếp & Làm việc nhóm'];

  const projects = Array.isArray(content.projects) && content.projects.length > 0
    ? content.projects
    : [
        {
          name: 'Hệ thống Tìm kiếm Việc làm & Thực tập',
          role: 'Fullstack Developer',
          tech: 'React, Node.js, Express, MySQL',
          description: 'Xây dựng website kết nối sinh viên và doanh nghiệp, quản lý tin tuyển dụng và theo dõi hồ sơ ứng tuyển trực tuyến.'
        }
      ];

  const coverLetter = cv?.cover_letter || extraInfo.cover_letter || '';

  return {
    fullName,
    title,
    email,
    phone,
    university,
    major,
    gpa,
    objective,
    education,
    skills,
    projects,
    coverLetter
  };
}

/**
 * Generate full standalone HTML document for the CV
 */
export function generateCVHTML(cv, extraInfo = {}) {
  const data = parseCVData(cv, extraInfo);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.fullName} - ${data.title} | TopCV Template</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    @page {
      size: A4;
      margin: 14mm 14mm 14mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      background-color: #f1f5f9;
      color: #1e293b;
      line-height: 1.5;
      font-size: 13.5px;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Action Bar (hidden during printing) */
    .top-action-bar {
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .action-guide {
      font-size: 13px;
      color: #94a3b8;
    }
    .action-guide b {
      color: #38bdf8;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .btn-close {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      margin-left: 8px;
    }
    .btn-close:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Main CV Paper Container (A4 Proportions) */
    .cv-paper {
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      background: #ffffff;
      padding: 24mm 20mm;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
      border-radius: 4px;
      position: relative;
    }

    /* CV Header */
    .cv-header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 22px;
      position: relative;
    }
    .cv-fullname {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }
    .cv-title {
      font-size: 15px;
      font-weight: 700;
      color: #2563eb;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cv-contact-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 14px;
      font-size: 13px;
      color: #475569;
    }
    .cv-contact-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .cv-contact-item span.icon {
      color: #2563eb;
      font-weight: 700;
    }

    /* Sections */
    .cv-section {
      margin-bottom: 22px;
    }
    .cv-section-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding-bottom: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cv-section-title::before {
      content: "";
      display: inline-block;
      width: 5px;
      height: 14px;
      background: #2563eb;
      border-radius: 2px;
    }

    .cv-text {
      color: #334155;
      line-height: 1.65;
      font-size: 13.5px;
    }

    /* Education & Project Items */
    .cv-item {
      margin-bottom: 14px;
    }
    .cv-item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .cv-item-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .cv-item-period {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .cv-item-sub {
      color: #475569;
      font-size: 13px;
      margin-bottom: 4px;
    }

    /* Skills Pill Grid */
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-badge {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 600;
    }

    /* Project Box */
    .project-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .project-tech {
      color: #2563eb;
      font-weight: 600;
      font-size: 12.5px;
      margin: 4px 0 6px;
    }

    /* Watermark Footer */
    .cv-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }

    /* Print Overrides */
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .cv-paper {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Action Bar for Quick Print / Save PDF -->
  <div class="top-action-bar no-print">
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-weight: 800; font-size: 16px; color: #38bdf8;">JobUTEHY · Xuất file CV</span>
      <span class="action-guide">
        Hộp thoại xuất file PDF đang tự động mở. Chọn <b>"Lưu dưới dạng PDF" (Save as PDF)</b> để tải về máy tính.
      </span>
    </div>
    <div>
      <button class="btn-print" onclick="window.print()">
        Tải về PDF ngay
      </button>
      <button class="btn-close" onclick="window.close()">
        Đóng
      </button>
    </div>
  </div>

  <!-- A4 CV Sheet -->
  <div class="cv-paper">
    <!-- Header -->
    <div class="cv-header">
      <h1 class="cv-fullname">${escapeHTML(data.fullName)}</h1>
      <div class="cv-title">${escapeHTML(data.title)}</div>
      
      <div class="cv-contact-row">
        ${data.email ? `<div class="cv-contact-item">Email: <b>${escapeHTML(data.email)}</b></div>` : ''}
        ${data.phone ? `<div class="cv-contact-item">SĐT: <b>${escapeHTML(data.phone)}</b></div>` : ''}
        ${data.university ? `<div class="cv-contact-item">Trường: <b>${escapeHTML(data.university)}</b></div>` : ''}
        ${data.gpa ? `<div class="cv-contact-item">GPA: <b>${escapeHTML(data.gpa)}</b></div>` : ''}
      </div>
    </div>

    <!-- Career Objective -->
    ${data.objective ? `
    <div class="cv-section">
      <div class="cv-section-title">Mục tiêu nghề nghiệp</div>
      <p class="cv-text">${escapeHTML(data.objective)}</p>
    </div>
    ` : ''}

    <!-- Education -->
    <div class="cv-section">
      <div class="cv-section-title">Học vấn & Bằng cấp</div>
      ${data.education.map(edu => `
        <div class="cv-item">
          <div class="cv-item-header">
            <span class="cv-item-title">${escapeHTML(edu.school || data.university)}</span>
            <span class="cv-item-period">${escapeHTML(edu.period || '2021 - 2025')}</span>
          </div>
          <div class="cv-item-sub">
            Chuyên ngành: <b>${escapeHTML(edu.major || data.major)}</b>
            ${edu.gpa ? ` • Điểm TB (GPA): <b>${escapeHTML(edu.gpa)}</b>` : ''}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Skills -->
    ${data.skills && data.skills.length > 0 ? `
    <div class="cv-section">
      <div class="cv-section-title">Kỹ năng chuyên môn</div>
      <div class="skills-grid">
        ${data.skills.map(s => `<span class="skill-badge">${escapeHTML(s)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Projects -->
    ${data.projects && data.projects.length > 0 ? `
    <div class="cv-section">
      <div class="cv-section-title">Dự án tiêu biểu</div>
      ${data.projects.map(p => `
        <div class="project-card">
          <div class="cv-item-header">
            <span class="cv-item-title">${escapeHTML(p.name)}</span>
            <span class="cv-item-period">${escapeHTML(p.role || 'Developer')}</span>
          </div>
          ${p.tech ? `<div class="project-tech">Công nghệ: ${escapeHTML(p.tech)}</div>` : ''}
          ${p.description ? `<p class="cv-text" style="font-size: 13px;">${escapeHTML(p.description)}</p>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Optional Cover Letter (if application context) -->
    ${data.coverLetter ? `
    <div class="cv-section">
      <div class="cv-section-title">Thư giới thiệu ứng tuyển</div>
      <p class="cv-text" style="white-space: pre-line;">${escapeHTML(data.coverLetter)}</p>
    </div>
    ` : ''}

    <!-- Footer Watermark -->
    <div class="cv-footer">
      <span>Cổng Thông Tin Việc Làm & Thực Tập Sinh Viên UTEHY</span>
      <span>Tạo từ JobUTEHY • TopCV Template Standard</span>
    </div>
  </div>

  <script>
    // Automatically trigger system print dialog after fonts render
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Triggers TopCV style direct print-to-PDF in a clean popup tab
 */
export function downloadCVAsPDF(cv, extraInfo = {}) {
  const html = generateCVHTML(cv, extraInfo);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // If popups are blocked, create a temporary iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  }
}
