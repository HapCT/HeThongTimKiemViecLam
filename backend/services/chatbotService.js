const { GoogleGenAI } = require('@google/genai');
const { pool } = require('../config/db');
const { buildJobFilters } = require('./jobSearch');

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const MAX_TOOL_ROUNDS = 3;
const MAX_JOBS_PER_SEARCH = 5;
const JOB_TYPES = ['full_time', 'part_time', 'internship'];

const SYSTEM_INSTRUCTION = `Bạn là trợ lý tìm việc của Hệ thống Tìm việc làm & Thực tập UTEHY, hỗ trợ sinh viên.
- Chỉ trả lời về việc làm, thực tập và cách tìm việc trên hệ thống. Câu hỏi ngoài lề thì lịch sự từ chối.
- Khi người dùng muốn tìm việc, luôn gọi hàm search_jobs. Không tự bịa tin tuyển dụng, công ty hay mức lương.
- Mức lương tính bằng VND/tháng (ví dụ "8 triệu" là 8000000).
- Danh sách tin sẽ hiện thành thẻ bên dưới câu trả lời, nên chỉ cần tóm tắt ngắn (tên vị trí, công ty), không chép lại toàn bộ.
- Không tìm thấy tin phù hợp thì nói rõ và gợi ý nới điều kiện (bỏ địa điểm, đổi từ khoá).
- Trả lời bằng tiếng Việt, ngắn gọn, tối đa khoảng 5 câu.
- Viết văn bản thuần, viết hoa và ghi số như bình thường, nhưng không dùng định dạng markdown (không **, #, gạch đầu dòng), vì giao diện hiển thị nguyên văn.`;

const searchJobsDeclaration = {
  name: 'search_jobs',
  description: 'Tìm tin tuyển dụng đang mở trên hệ thống. Mọi tham số đều không bắt buộc.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Từ khoá: kỹ năng, vị trí hoặc tên công ty, ví dụ "React", "Tester", "FPT"' },
      location: { type: 'string', description: 'Tỉnh/thành phố, ví dụ "Hà Nội", "Hưng Yên"' },
      job_type: { type: 'string', enum: JOB_TYPES, description: 'full_time: toàn thời gian, part_time: bán thời gian, internship: thực tập' },
      min_salary: { type: 'integer', description: 'Lương tối thiểu mong muốn, VND/tháng' }
    }
  }
};

// Chỉ nhận các tham số hợp lệ từ model, không tin tuyệt đối dữ liệu model trả về
function sanitizeSearchArgs(args = {}) {
  const clean = {};
  if (typeof args.keyword === 'string' && args.keyword.trim()) clean.keyword = args.keyword.trim().slice(0, 100);
  if (typeof args.location === 'string' && args.location.trim()) clean.location = args.location.trim().slice(0, 100);
  if (JOB_TYPES.includes(args.job_type)) clean.job_type = args.job_type;
  const minSalary = parseInt(args.min_salary, 10);
  if (Number.isFinite(minSalary) && minSalary > 0) clean.min_salary = minSalary;
  return clean;
}

// Chatbot chỉ tìm trong tin đã duyệt, còn hạn, chưa xoá (giống khách xem trang /jobs)
async function searchJobsForChat(args) {
  const { whereSql, params } = buildJobFilters({ ...sanitizeSearchArgs(args), status: 'approved' });
  const [jobs] = await pool.query(
    `SELECT j.id, j.title, j.job_type, j.location, j.salary_min, j.salary_max, j.salary_negotiable, j.deadline,
            comp.name AS company_name, comp.logo_url AS company_logo
     FROM jobs j
     LEFT JOIN companies comp ON j.company_id = comp.id
     ${whereSql}
     ORDER BY j.created_at DESC
     LIMIT ?`,
    [...params, MAX_JOBS_PER_SEARCH]
  );
  return jobs;
}

let defaultClient = null;
function getDefaultClient() {
  if (!defaultClient) {
    defaultClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      // Mặc định SDK tự thử lại 5 lần khi Gemini quá tải, người dùng phải chờ rất lâu; không thử lại để báo lỗi sớm
      httpOptions: { timeout: 30000, retryOptions: { attempts: 1 } }
    });
  }
  return defaultClient;
}

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Gửi hội thoại cho Gemini, cho phép model gọi search_jobs để tra CSDL.
 * @param {{role: 'user'|'model', text: string}[]} messages
 * @param {{ client?: GoogleGenAI }} options client dùng để thay thế khi kiểm thử
 * @returns {Promise<{ reply: string, jobs: object[] }>}
 */
async function chat(messages, { client = getDefaultClient() } = {}) {
  const contents = messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] }));
  const foundJobs = new Map();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Lượt cuối không cho gọi hàm nữa để model buộc phải trả lời
        tools: round < MAX_TOOL_ROUNDS ? [{ functionDeclarations: [searchJobsDeclaration] }] : undefined
      }
    });

    const calls = response.functionCalls || [];
    if (calls.length === 0) {
      return {
        reply: (response.text || '').trim() || 'Xin lỗi, mình chưa trả lời được câu này. Bạn thử hỏi cách khác nhé.',
        jobs: [...foundJobs.values()]
      };
    }

    contents.push(response.candidates[0].content);
    const responseParts = [];
    for (const call of calls) {
      let result;
      if (call.name === 'search_jobs') {
        const jobs = await searchJobsForChat(call.args);
        jobs.forEach((job) => foundJobs.set(job.id, job));
        result = { total: jobs.length, jobs };
      } else {
        result = { error: `Không có hàm ${call.name}` };
      }
      responseParts.push({ functionResponse: { id: call.id, name: call.name, response: result } });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  return { reply: 'Mình tìm được các tin dưới đây, bạn xem thử nhé.', jobs: [...foundJobs.values()] };
}

module.exports = { chat, isConfigured, searchJobsForChat, sanitizeSearchArgs };
