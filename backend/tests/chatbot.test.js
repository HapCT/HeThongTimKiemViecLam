// Chatbot gợi ý việc làm: kiểm phần tra CSDL và API mà không gọi Gemini thật.
// Gemini được thay bằng client giả; server kiểm thử chạy với GEMINI_API_KEY rỗng.
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const { request } = require('./helpers');
const { pool } = require('../config/db');
const { chat, searchJobsForChat, sanitizeSearchArgs } = require('../services/chatbotService');

async function getStatuses(ids) {
  if (ids.length === 0) return [];
  const [rows] = await pool.query(
    'SELECT id, status, is_deleted, (deadline IS NULL OR deadline >= CURDATE()) AS open FROM jobs WHERE id IN (?)',
    [ids]
  );
  return rows;
}

// Client giả trả lần lượt các response cho trước và ghi lại request đã nhận
function fakeClient(responses) {
  const requests = [];
  return {
    requests,
    models: {
      generateContent: async (req) => {
        requests.push(structuredClone(req));
        return responses.shift();
      }
    }
  };
}

describe('=== CHATBOT GỢI Ý VIỆC LÀM ===', () => {
  after(() => pool.end());

  describe('1. Hàm search_jobs', () => {
    test('Chỉ trả tin đã duyệt, còn hạn, chưa xoá, tối đa 5 tin', async () => {
      const jobs = await searchJobsForChat({});
      assert.ok(jobs.length > 0 && jobs.length <= 5);
      const rows = await getStatuses(jobs.map((j) => j.id));
      for (const row of rows) {
        assert.equal(row.status, 'approved');
        assert.equal(row.is_deleted, 0);
        assert.equal(row.open, 1);
      }
    });

    test('Tìm đúng tên một tin đang chờ duyệt cũng không lộ tin đó', async () => {
      const [[pending]] = await pool.query("SELECT id, title FROM jobs WHERE status = 'pending' LIMIT 1");
      assert.ok(pending, 'Seed phải có ít nhất một tin pending');
      const jobs = await searchJobsForChat({ keyword: pending.title });
      assert.ok(!jobs.some((j) => j.id === pending.id));
    });

    test('Lọc theo loại hình và địa điểm', async () => {
      const jobs = await searchJobsForChat({ job_type: 'internship', location: 'Hà Nội' });
      assert.ok(jobs.length > 0);
      for (const job of jobs) {
        assert.equal(job.job_type, 'internship');
        assert.match(job.location, /Hà Nội/);
      }
    });

    test('Bỏ qua tham số sai kiểu hoặc ngoài danh sách mà model gửi lên', () => {
      assert.deepEqual(
        sanitizeSearchArgs({ keyword: '  React ', job_type: 'freelance', min_salary: -5, location: 123, extra: 'x' }),
        { keyword: 'React' }
      );
      assert.deepEqual(sanitizeSearchArgs({ min_salary: '8000000', job_type: 'part_time' }), {
        min_salary: 8000000,
        job_type: 'part_time'
      });
    });
  });

  describe('2. Vòng gọi hàm với Gemini (client giả)', () => {
    test('Model gọi search_jobs rồi trả lời: API trả về câu trả lời và danh sách tin thật', async () => {
      const callContent = {
        role: 'model',
        parts: [{ functionCall: { id: 'c1', name: 'search_jobs', args: { job_type: 'internship' } } }]
      };
      const client = fakeClient([
        { functionCalls: [callContent.parts[0].functionCall], candidates: [{ content: callContent }] },
        { functionCalls: undefined, text: 'Có vài tin thực tập phù hợp với bạn.' }
      ]);

      const result = await chat([{ role: 'user', text: 'Tìm việc thực tập' }], { client });

      assert.equal(result.reply, 'Có vài tin thực tập phù hợp với bạn.');
      assert.ok(result.jobs.length > 0);
      assert.ok(result.jobs.every((j) => j.job_type === 'internship'));

      // Lượt thứ hai phải gửi kết quả tra CSDL lại cho model
      const lastContent = client.requests[1].contents.at(-1);
      const fnResponse = lastContent.parts[0].functionResponse;
      assert.equal(fnResponse.name, 'search_jobs');
      assert.equal(fnResponse.response.total, result.jobs.length);
    });

    test('Câu hỏi không cần tra cứu: trả lời luôn, không có tin nào', async () => {
      const client = fakeClient([{ functionCalls: undefined, text: 'Chào bạn!' }]);
      const result = await chat([{ role: 'user', text: 'Xin chào' }], { client });
      assert.deepEqual(result, { reply: 'Chào bạn!', jobs: [] });
    });

    test('Model gọi hàm mãi: dừng sau 3 lượt và tắt tools ở lượt cuối', async () => {
      const call = { id: 'c', name: 'search_jobs', args: {} };
      const loop = () => ({ functionCalls: [call], candidates: [{ content: { role: 'model', parts: [{ functionCall: call }] } }] });
      const client = fakeClient([loop(), loop(), loop(), { text: 'Xong.' }]);
      const result = await chat([{ role: 'user', text: 'Tìm việc' }], { client });
      assert.equal(result.reply, 'Xong.');
      assert.equal(client.requests.length, 4);
      assert.equal(client.requests[3].config.tools, undefined);
    });
  });

  describe('3. API POST /chatbot', () => {
    const post = (body) => request('/chatbot', { method: 'POST', body: JSON.stringify(body) });

    test('Thiếu messages → 400', async () => {
      const res = await post({});
      assert.equal(res.status, 400);
    });

    test('Tin nhắn cuối không phải của người dùng → 400', async () => {
      const res = await post({ messages: [{ role: 'user', text: 'Hi' }, { role: 'model', text: 'Chào' }] });
      assert.equal(res.status, 400);
    });

    test('Tin nhắn quá 1000 ký tự → 400', async () => {
      const res = await post({ messages: [{ role: 'user', text: 'a'.repeat(1001) }] });
      assert.equal(res.status, 400);
    });

    test('Hợp lệ nhưng máy chủ chưa có GEMINI_API_KEY → 503 với thông báo rõ ràng', async () => {
      const res = await post({ messages: [{ role: 'user', text: 'Tìm việc React ở Hà Nội' }] });
      assert.equal(res.status, 503);
      assert.equal(res.data.success, false);
      assert.match(res.data.message, /chưa được cấu hình/);
    });
  });
});
