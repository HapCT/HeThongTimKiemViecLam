const nodemailer = require('nodemailer');

// Configure transporter from environment variables or create test transporter
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Gửi email mời phỏng vấn tới sinh viên
 */
exports.sendInterviewEmail = async ({ toEmail, candidateName, companyName, jobTitle, scheduledAt, format, location, note }) => {
  const subject = `[UTEHY Internship] Lời mời phỏng vấn từ ${companyName} - Vị trí: ${jobTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
        <h2 style="color: #2563eb; margin: 0;">HỆ THỐNG VIỆC LÀM & THỰC TẬP UTEHY</h2>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0;">Thông báo lịch hẹn phỏng vấn thực tập</p>
      </div>
      
      <div style="padding: 20px 0;">
        <p>Xin chào <strong>${candidateName || 'bạn sinh viên'}</strong>,</p>
        <p>Doanh nghiệp <strong>${companyName}</strong> trân trọng mời bạn tham dự buổi phỏng vấn cho vị trí <strong>${jobTitle}</strong> với thông tin chi tiết như sau:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 6px 0;"><strong>⏰ Thời gian:</strong> ${scheduledAt}</p>
          <p style="margin: 6px 0;"><strong>🏢 Hình thức:</strong> ${format === 'online' ? 'Phỏng vấn Trực tuyến (Google Meet)' : 'Phỏng vấn Trực tiếp tại Doanh nghiệp'}</p>
          <p style="margin: 6px 0;"><strong>📍 Địa điểm / Link họp:</strong> <a href="${location}" target="_blank" style="color: #2563eb;">${location}</a></p>
          ${note ? `<p style="margin: 6px 0;"><strong>📝 Ghi chú từ nhà tuyển dụng:</strong> ${note}</p>` : ''}
        </div>
        
        <p>Vui lòng đăng nhập vào hệ thống để bấm <strong>"Xác nhận tham gia"</strong> để nhà tuyển dụng chuẩn bị chu đáo nhất.</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:3000/candidate/interviews" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Xác nhận tham gia phỏng vấn
          </a>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p>Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY) - Khoa Công nghệ Thông tin</p>
        <p>Email này được gửi tự động từ Hệ thống tìm kiếm việc làm & thực tập sinh viên.</p>
      </div>
    </div>
  `;

  if (transporter && toEmail) {
    try {
      await transporter.sendMail({
        from: `"UTEHY Job Portal" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html
      });
      console.log(`📧 [EMAIL SENT] Mời phỏng vấn tới: ${toEmail}`);
    } catch (err) {
      console.error(`⚠️ [EMAIL FAILED] Gửi email thất bại:`, err.message);
    }
  } else {
    console.log(`🔔 [EMAIL SIMULATED] Gửi thư phỏng vấn tới sinh viên ${toEmail} (${candidateName}): ${subject}`);
  }
};

/**
 * Gửi email cập nhật trạng thái ứng tuyển (tiếp nhận / từ chối)
 */
exports.sendApplicationStatusEmail = async ({ toEmail, candidateName, companyName, jobTitle, status, note }) => {
  const isAccepted = status === 'accepted';
  const statusTitle = isAccepted ? 'Tiếp nhận thực tập chính thức 🎉' : 'Thông báo kết quả ứng tuyển';
  const subject = `[UTEHY Internship] ${statusTitle} từ ${companyName} - Vị trí: ${jobTitle}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${isAccepted ? '#059669' : '#e2e8f0'};">
        <h2 style="color: ${isAccepted ? '#059669' : '#0f172a'}; margin: 0;">${isAccepted ? 'CHÚC MỪNG BẠN TRÚNG TUYỂN THỰC TẬP!' : 'THÔNG BÁO KẾT QUẢ HỒ SƠ'}</h2>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0 0;">Cập nhật từ Doanh nghiệp ${companyName}</p>
      </div>
      
      <div style="padding: 20px 0;">
        <p>Xin chào <strong>${candidateName || 'bạn sinh viên'}</strong>,</p>
        <p>Doanh nghiệp <strong>${companyName}</strong> đã xem xét hồ sơ ứng tuyển vị trí <strong>${jobTitle}</strong> của bạn.</p>
        
        <div style="background-color: ${isAccepted ? '#ecfdf5' : '#f8fafc'}; border-left: 4px solid ${isAccepted ? '#059669' : '#94a3b8'}; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 6px 0; font-size: 15px; font-weight: bold; color: ${isAccepted ? '#047857' : '#475569'};">
            Trạng thái: ${isAccepted ? 'Được tiếp nhận thực tập' : 'Hồ sơ chưa phù hợp trong đợt này'}
          </p>
          ${note ? `<p style="margin: 6px 0;"><strong>Lời nhắn từ nhà tuyển dụng:</strong> ${note}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="http://localhost:3000/candidate/applications" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Xem chi tiết trên hệ thống
          </a>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p>Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY) - Khoa Công nghệ Thông tin</p>
      </div>
    </div>
  `;

  if (transporter && toEmail) {
    try {
      await transporter.sendMail({
        from: `"UTEHY Job Portal" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject,
        html
      });
      console.log(`📧 [EMAIL SENT] Cập nhật ứng tuyển tới: ${toEmail}`);
    } catch (err) {
      console.error(`⚠️ [EMAIL FAILED] Gửi email thất bại:`, err.message);
    }
  } else {
    console.log(`🔔 [EMAIL SIMULATED] Gửi thông báo kết quả hồ sơ tới ${toEmail} (${candidateName}): ${statusTitle}`);
  }
};
