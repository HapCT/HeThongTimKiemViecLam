// Ca thành công của các luồng chính, dùng đúng payload mà web/mobile gửi lên.
// Bổ sung cho system.test.js (chủ yếu kiểm các ca bị từ chối).
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { request, login } = require('./helpers');
const { sendInterviewEmail } = require('../services/emailService');

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe('=== LUỒNG CHÍNH: CA THÀNH CÔNG ===', () => {
  let adminToken, fptToken, cand1Token;

  before(async () => {
    adminToken = await login('admin@utehy.edu.vn');
    fptToken = await login('hr@fpt.com');
    cand1Token = await login('phamhuyanh44@gmail.com');
  });

  describe('1. Đăng ký (payload của web RegisterPage và mobile registerStudent)', () => {
    test('Đăng ký ứng viên thành công, họ tên được lưu đúng', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `flow.candidate.${Date.now()}@example.test`,
          password: 'Pass1234',
          role: 'candidate',
          phone: '0901234567',
          fullName: 'Nguyễn Văn Kiểm Thử',
          university: 'ĐH Sư phạm Kỹ thuật Hưng Yên',
          major: 'Công nghệ thông tin'
        })
      });
      assert.strictEqual(res.status, 201, JSON.stringify(res.data));
      assert.ok(res.data?.data?.token);
      assert.strictEqual(res.data.data.user.candidate_name, 'Nguyễn Văn Kiểm Thử');
    });

    test('Đăng ký doanh nghiệp thành công, tên công ty và MST được lưu đúng', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: `flow.company.${Date.now()}@example.test`,
          password: 'Pass1234',
          role: 'company',
          phone: '0241234567',
          companyName: 'Công ty Kiểm Thử',
          taxCode: '0101234567',
          website: 'https://example.test',
          address: 'Hưng Yên'
        })
      });
      assert.strictEqual(res.status, 201, JSON.stringify(res.data));
      assert.strictEqual(res.data.data.user.company_name, 'Công ty Kiểm Thử');
      assert.strictEqual(res.data.data.user.tax_code, '0101234567');
    });

    test('Thông báo lỗi validate bằng tiếng Việt', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ password: 'Pass1234', role: 'candidate', fullName: 'A' })
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /Vui lòng nhập email/);
    });
  });

  describe('2. Đăng tin và sửa tin (payload của web CompanyDashboardPage)', () => {
    let jobId;

    test('Doanh nghiệp đăng tin full_time có danh mục và lương', async () => {
      const res = await request('/jobs', {
        method: 'POST',
        headers: authHeader(fptToken),
        body: JSON.stringify({
          title: 'Lập trình viên Node.js (kiểm thử)',
          category_id: 1,
          job_type: 'full_time',
          location: 'Hà Nội',
          salary_min: 10000000,
          salary_max: 15000000,
          salary_negotiable: false,
          quantity: 3,
          deadline: '2027-12-31',
          description: 'Phát triển API cho hệ thống tuyển dụng.',
          requirements: 'Biết Node.js',
          benefits: 'Lương tháng 13'
        })
      });
      assert.strictEqual(res.status, 201, JSON.stringify(res.data));
      jobId = res.data.data.id;
      assert.ok(jobId);

      const detail = await request(`/jobs/${jobId}`, { headers: authHeader(fptToken) });
      assert.strictEqual(detail.status, 200);
      const job = detail.data.data;
      assert.strictEqual(job.job_type, 'full_time');
      assert.strictEqual(job.category_id, 1);
      assert.strictEqual(Number(job.salary_min), 10000000);
      assert.strictEqual(Number(job.salary_max), 15000000);
      assert.strictEqual(job.quantity, 3);
      assert.strictEqual(job.status, 'pending');
    });

    test('Sửa tin giữ nguyên danh mục và cập nhật lương', async () => {
      const res = await request(`/jobs/${jobId}`, {
        method: 'PUT',
        headers: authHeader(fptToken),
        body: JSON.stringify({
          title: 'Lập trình viên Node.js (kiểm thử, đã sửa)',
          category_id: 1,
          job_type: 'part_time',
          location: 'Hà Nội',
          salary_min: 12000000,
          salary_max: 18000000,
          salary_negotiable: false,
          quantity: 2,
          deadline: '2027-12-31',
          description: 'Phát triển API cho hệ thống tuyển dụng.',
          status: 'pending'
        })
      });
      assert.strictEqual(res.status, 200, JSON.stringify(res.data));

      const job = (await request(`/jobs/${jobId}`, { headers: authHeader(fptToken) })).data.data;
      assert.strictEqual(job.job_type, 'part_time');
      assert.strictEqual(job.category_id, 1);
      assert.strictEqual(Number(job.salary_max), 18000000);
      assert.strictEqual(job.quantity, 2);
    });

    test('Admin từ chối tin kèm lý do, lý do được lưu', async () => {
      const reason = 'Mô tả công việc chưa rõ ràng';
      const res = await request(`/admin/jobs/${jobId}/review`, {
        method: 'PATCH',
        headers: authHeader(adminToken),
        body: JSON.stringify({ status: 'rejected', reject_reason: reason })
      });
      assert.strictEqual(res.status, 200, JSON.stringify(res.data));

      const job = (await request(`/jobs/${jobId}`, { headers: authHeader(adminToken) })).data.data;
      assert.strictEqual(job.status, 'rejected');
      assert.strictEqual(job.reject_reason, reason);
    });

    test('Route /jobs/:id/status giữ lại reject_reason khi admin từ chối', async () => {
      const reason = 'Thiếu mức lương cụ thể';
      const res = await request(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: authHeader(adminToken),
        body: JSON.stringify({ status: 'rejected', reject_reason: reason })
      });
      assert.strictEqual(res.status, 200, JSON.stringify(res.data));

      const job = (await request(`/jobs/${jobId}`, { headers: authHeader(adminToken) })).data.data;
      assert.strictEqual(job.reject_reason, reason);
    });
  });

  describe('3. Đánh giá doanh nghiệp', () => {
    test('Gửi đánh giá hợp lệ -> 201, gửi lần hai -> 400', async () => {
      // Ứng viên Phạm Huy Anh chưa đánh giá VNG (company id 3) trong dữ liệu seed
      const body = JSON.stringify({ rating: 4, comment: 'Môi trường làm việc thân thiện, mentor nhiệt tình.' });
      const first = await request('/companies/3/reviews', { method: 'POST', headers: authHeader(cand1Token), body });
      assert.strictEqual(first.status, 201, JSON.stringify(first.data));

      const second = await request('/companies/3/reviews', { method: 'POST', headers: authHeader(cand1Token), body });
      assert.strictEqual(second.status, 400);
    });
  });

  describe('4. Lịch phỏng vấn và email', () => {
    test('Doanh nghiệp đặt lịch phỏng vấn cho đơn của mình -> 201', async () => {
      // Đơn id 3: Nguyễn Văn An ứng tuyển FPT Java (trạng thái submitted) trong dữ liệu seed
      const res = await request('/interviews', {
        method: 'POST',
        headers: authHeader(fptToken),
        body: JSON.stringify({
          application_id: 3,
          scheduled_at: '2027-01-15 09:00:00',
          format: 'online',
          location: 'https://meet.google.com/abc-defg-hij',
          note: 'Chuẩn bị giới thiệu bản thân'
        })
      });
      assert.strictEqual(res.status, 201, JSON.stringify(res.data));
    });

    test('Email mời phỏng vấn tạo được nội dung và escape link độc hại', async () => {
      const { html } = await sendInterviewEmail({
        candidateName: 'An',
        companyName: 'FPT',
        jobTitle: 'Java',
        scheduledAt: '15/01/2027 09:00',
        format: 'online',
        location: 'https://meet.google.com/x"><script>alert(1)</script>',
        note: '<b>ghi chú</b>'
      });
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
      assert.ok(html.includes('&lt;b&gt;ghi chú&lt;/b&gt;'));
    });

    test('Địa điểm phỏng vấn không phải link thì hiện dạng chữ, không thành thẻ <a>', async () => {
      const { html } = await sendInterviewEmail({
        companyName: 'FPT',
        jobTitle: 'Java',
        scheduledAt: '15/01/2027 09:00',
        format: 'offline',
        location: 'javascript:alert(1)'
      });
      assert.ok(!html.includes('href="javascript:'));
    });
  });
});
