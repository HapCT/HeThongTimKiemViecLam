const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { request, login, BASE_URL } = require('./helpers');

describe('=== BỘ KIỂM THỬ HỆ THỐNG TOÀN DIỆN (ƯU TIÊN 1 - 4) ===', () => {
  let adminToken, fptToken, viettelToken, rikkeiToken, cand1Token, cand2Token;

  before(async () => {
    adminToken = await login('admin@utehy.edu.vn');
    fptToken = await login('hr@fpt.com');
    viettelToken = await login('hr@viettel.com.vn');
    rikkeiToken = await login('career@rikkeisoft.com');
    cand1Token = await login('phamhuyanh44@gmail.com');
    cand2Token = await login('nguyenvanan@utehy.edu.vn');
  });

  describe('1. Kiểm thử Xác thực, Đăng ký & Bảo vệ Header (Ưu tiên 2 & 3)', () => {
    test('Đăng nhập sai mật khẩu phải trả về 401 và không có token', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@utehy.edu.vn', password: 'wrongpassword' })
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data?.success, false);
      assert.strictEqual(res.data?.data?.token, undefined);
    });

    test('Đăng nhập không gửi mật khẩu phải bị từ chối 400 bởi Zod validation', async () => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@utehy.edu.vn' })
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data?.success, false);
    });

    test('Đường tắt /auth/demo-login phải không tồn tại (404)', async () => {
      const res = await request('/auth/demo-login');
      assert.strictEqual(res.status, 404);
    });

    test('Header giả mạo x-user-id: 1 khi không có JWT phải bị từ chối 401', async () => {
      const res = await request('/auth/me', {
        headers: { 'x-user-id': '1' }
      });
      assert.strictEqual(res.status, 401);
    });

    test('Response có chứa HTTP Security Headers từ Helmet', async () => {
      const res = await request('/health');
      assert.ok(res.headers.get('x-content-type-options'));
      assert.ok(res.headers.get('x-frame-options'));
    });

    test('Đăng ký tài khoản mật khẩu dưới 6 ký tự bị từ chối 400', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test_short_pwd@gmail.com',
          password: '123',
          role: 'candidate',
          full_name: 'Nguyễn Văn Test'
        })
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data?.success, false);
    });

    test('Đăng ký ứng viên thiếu họ tên bị từ chối 400', async () => {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test_no_name@gmail.com',
          password: 'password123',
          role: 'candidate'
        })
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data?.success, false);
    });
  });

  describe('2. Kiểm thử Lỗ hổng CV & Tệp đính kèm (Ưu tiên 1a & Ưu tiên 2)', () => {
    let uploadedCvId = null;
    let uploadedCvFileUrl = null;

    test('Tải lên CV hợp lệ (PDF) thành công -> 200/201', async () => {
      const formData = new FormData();
      const fakePdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
      const blob = new Blob([fakePdfContent], { type: 'application/pdf' });
      formData.append('file', blob, 'test_cv_security.pdf');

      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const res = await fetch(`${serverRoot}/api/candidates/cvs/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cand1Token}`
        },
        body: formData
      });
      const data = await res.json();
      assert.ok(res.status === 200 || res.status === 201, `Status expected 200/201, got ${res.status}`);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.file_url);
      uploadedCvId = data.data.id;
      uploadedCvFileUrl = data.data.file_url;
    });

    test('Gọi link file CV kèm ?token=... mà KHÔNG có header Authorization -> 401', async () => {
      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const fullUrl = `${serverRoot}${uploadedCvFileUrl}?token=${cand1Token}`;
      const res = await fetch(fullUrl);
      assert.strictEqual(res.status, 401);
    });

    test('Gọi link file CV kèm header Authorization hợp lệ -> 200', async () => {
      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const fullUrl = `${serverRoot}${uploadedCvFileUrl}`;
      const res = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${cand1Token}`
        }
      });
      assert.strictEqual(res.status, 200);
    });

    test('Ứng viên khác (cand2) cố tình truy cập file CV của cand1 -> 403', async () => {
      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const fullUrl = `${serverRoot}${uploadedCvFileUrl}`;
      const res = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${cand2Token}`
        }
      });
      assert.strictEqual(res.status, 403);
    });

    test('Xóa CV -> file vật lý biến mất trên đĩa và link cũ trả về 404', async () => {
      // 1. Kiểm tra file vật lý đang tồn tại trước khi xóa
      const filename = path.basename(uploadedCvFileUrl);
      const filePath = path.join(__dirname, '..', 'uploads', 'cvs', filename);
      assert.ok(fs.existsSync(filePath), 'File vật lý phải tồn tại trước khi xóa');

      // 2. Thực hiện xóa CV
      const delRes = await request(`/candidates/cvs/${uploadedCvId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${cand1Token}` }
      });
      assert.strictEqual(delRes.status, 200);

      // 3. File vật lý phải biến mất khỏi thư mục uploads/cvs
      assert.ok(!fs.existsSync(filePath), 'File vật lý phải bị xóa khỏi đĩa');

      // 4. Mở link cũ kể cả có token admin -> 404
      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const checkRes = await fetch(`${serverRoot}${uploadedCvFileUrl}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(checkRes.status, 404);
    });

    test('Upload CV sai định dạng (.txt) bị từ chối 400 tiếng Việt', async () => {
      const formData = new FormData();
      const blob = new Blob([Buffer.from('Đây là file text không hợp lệ')], { type: 'text/plain' });
      formData.append('file', blob, 'invalid.txt');

      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const res = await fetch(`${serverRoot}/api/candidates/cvs/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: formData
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('PDF, DOC, DOCX') || data.message.includes('định dạng'));
    });

    test('Upload CV vượt quá dung lượng 5MB bị từ chối 400 tiếng Việt', async () => {
      const formData = new FormData();
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      const blob = new Blob([bigBuffer], { type: 'application/pdf' });
      formData.append('file', blob, 'oversize.pdf');

      const serverRoot = BASE_URL.replace(/\/api\/?$/, '');
      const res = await fetch(`${serverRoot}/api/candidates/cvs/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: formData
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('5MB') || data.message.includes('dung lượng') || data.message.includes('giới hạn'));
    });
  });

  describe('3. Kiểm thử Tin đã lưu & Rò rỉ tin chưa duyệt (Ưu tiên 1b)', () => {
    test('Ứng viên lưu job_id của tin pending -> 404', async () => {
      // Tin id = 13 (FPT vừa tạo, đang pending)
      const res = await request('/saved-jobs/toggle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: JSON.stringify({ job_id: 13 })
      });
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data?.success, false);
    });

    test('Lưu tin approved thành công -> 200/201', async () => {
      // Tin id = 1 (FPT, approved)
      const res = await request('/saved-jobs/toggle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: JSON.stringify({ job_id: 1 })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data?.success, true);
    });

    test('Bỏ lưu tin đã lưu thành công -> 200', async () => {
      // Gọi toggle lần 2 với tin 1 -> chuyển sang unsaved
      const res = await request('/saved-jobs/toggle', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: JSON.stringify({ job_id: 1 })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data?.success, true);
    });

    test('Danh sách việc làm đã lưu không bao giờ rò rỉ nội dung tin không approved', async () => {
      const res = await request('/saved-jobs', {
        headers: { Authorization: `Bearer ${cand1Token}` }
      });
      assert.strictEqual(res.status, 200);
      const jobs = res.data?.data || [];
      for (const item of jobs) {
        const jobStatus = item.status || item.job_status;
        if (jobStatus !== 'approved') {
          assert.strictEqual(item.description, null, 'Nội dung tin chưa duyệt không được hiển thị');
          assert.strictEqual(item.requirements, null);
        }
      }
    });
  });

  describe('4. Kiểm thử Logic Tin tuyển dụng & Reset về Pending khi cập nhật (Ưu tiên 3 & 4)', () => {
    test('Doanh nghiệp FPT cập nhật tin đã duyệt (id: 1) -> tin tự động chuyển về pending', async () => {
      const updateRes = await request('/jobs/1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${fptToken}` },
        body: JSON.stringify({
          title: 'Thực tập sinh Java Spring Boot (Đã cập nhật tiêu chuẩn mới)',
          description: 'Mô tả công việc chi tiết được cập nhật lại chuẩn mực quốc tế.',
          location: 'Hà Nội'
        })
      });
      assert.strictEqual(updateRes.status, 200);

      // Kiểm tra trạng thái của tin sau khi sửa
      const checkRes = await request('/jobs/1', {
        headers: { Authorization: `Bearer ${fptToken}` }
      });
      assert.strictEqual(checkRes.status, 200);
      assert.strictEqual(checkRes.data?.data?.status, 'pending');
    });

    test('Tin vừa về pending: Khách vãng lai xem chi tiết -> 404', async () => {
      const res = await request('/jobs/1');
      assert.strictEqual(res.status, 404);
    });

    test('Tin vừa về pending: Doanh nghiệp khác (Viettel) xem chi tiết -> 404', async () => {
      const res = await request('/jobs/1', {
        headers: { Authorization: `Bearer ${viettelToken}` }
      });
      assert.strictEqual(res.status, 404);
    });

    test('Admin duyệt lại tin id: 1 thành approved', async () => {
      const res = await request('/jobs/1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'approved' })
      });
      assert.strictEqual(res.status, 200);

      // Khách vãng lai xem lại được -> 200
      const viewRes = await request('/jobs/1');
      assert.strictEqual(viewRes.status, 200);
      assert.strictEqual(viewRes.data?.data?.status, 'approved');
    });

    test('Admin updateJob với company_id không tồn tại bị từ chối 400', async () => {
      const res = await request('/jobs/1', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          company_id: 999999,
          title: 'Tin gán nhầm company'
        })
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data?.success, false);
    });
  });

  describe('5. Kiểm thử Phân quyền Lịch phỏng vấn (Ưu tiên 4)', () => {
    test('Ứng viên đổi trạng thái lịch sang cancelled bị từ chối 400', async () => {
      // Ứng viên chỉ được confirmed hoặc declined
      const res = await request('/interviews/1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${cand1Token}` },
        body: JSON.stringify({ status: 'cancelled' })
      });
      assert.strictEqual(res.status, 400);
    });

    test('Ứng viên B cố đổi trạng thái lịch phỏng vấn của Ứng viên A -> 403', async () => {
      const res = await request('/interviews/1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${cand2Token}` },
        body: JSON.stringify({ status: 'confirmed' })
      });
      assert.strictEqual(res.status, 403);
    });

    test('Doanh nghiệp khác (Viettel) cố đổi trạng thái lịch phỏng vấn của FPT -> 403', async () => {
      const res = await request('/interviews/1/status', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${viettelToken}` },
        body: JSON.stringify({ status: 'done' })
      });
      assert.strictEqual(res.status, 403);
    });
  });

  describe('6. Kiểm thử Đánh giá Công ty & Ràng buộc Dữ liệu (Ưu tiên 3)', () => {
    test('Đánh giá rating số thập phân "4.5" bị từ chối 400', async () => {
      const res = await request('/companies/2/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand2Token}` },
        body: JSON.stringify({ rating: '4.5', comment: 'Đánh giá thử nghiệm số thập phân' })
      });
      assert.strictEqual(res.status, 400);
    });

    test('Đánh giá comment không phải chuỗi hoặc quá ngắn (< 5 ký tự) bị từ chối 400', async () => {
      const res = await request('/companies/2/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand2Token}` },
        body: JSON.stringify({ rating: 5, comment: 'Tốt' })
      });
      assert.strictEqual(res.status, 400);
    });

    test('Mỗi ứng viên chỉ được đánh giá 1 lần cho 1 công ty -> lần 2 bị từ chối 400', async () => {
      // Đã đánh giá thành công lần 1 (trong seed data hoặc tạo mới)
      // Thử đánh giá thêm lần nữa
      const res = await request('/companies/4/reviews', {
        method: 'POST',
        headers: { Authorization: `Bearer ${cand2Token}` },
        body: JSON.stringify({ rating: 5, comment: 'Đánh giá lặp lại lần 2 cho MoMo' })
      });
      assert.strictEqual(res.status, 400);
    });
  });
});
