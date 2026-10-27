const { z } = require('zod');

/**
 * Middleware factory validate request data using Zod schema
 * @param {z.ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const fieldPath = firstIssue.path.join('.');
      const errorMessage = firstIssue.message || 'Dữ liệu không hợp lệ';
      return res.status(400).json({
        success: false,
        message: fieldPath ? `${fieldPath}: ${errorMessage}` : errorMessage,
        errors: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message
        }))
      });
    }
    // Gán dữ liệu đã validate & transform lại vào req[source]
    req[source] = result.data;
    next();
  };
};

// 1. Auth Schemas
const authSchemas = {
  login: z.object({
    email: z.string({ error: 'Vui lòng nhập email' }).email('Email không đúng định dạng'),
    password: z.string({ error: 'Vui lòng nhập mật khẩu' }).min(1, 'Mật khẩu không được để trống')
  }),

  register: z.object({
    email: z.string({ error: 'Vui lòng nhập email' }).email('Email không đúng định dạng'),
    password: z.string({ error: 'Vui lòng nhập mật khẩu' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    role: z.enum(['candidate', 'company'], {
      error: 'Vai trò phải là candidate hoặc company'
    }).default('candidate'),
    // Tên trường khớp với payload của web/mobile và authController.register
    fullName: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    phone: z.string().nullish(),
    university: z.string().nullish(),
    major: z.string().nullish(),
    taxCode: z.string().nullish(),
    website: z.string().nullish(),
    address: z.string().nullish()
  }).superRefine((data, ctx) => {
    if (data.role === 'candidate' && !data.fullName) {
      ctx.addIssue({
        code: 'custom',
        path: ['fullName'],
        message: 'Vui lòng nhập họ và tên ứng viên'
      });
    }
    if (data.role === 'company' && !data.companyName) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: 'Vui lòng nhập tên công ty/doanh nghiệp'
      });
    }
  }),

  changePassword: z.object({
    currentPassword: z.string({ error: 'Vui lòng nhập mật khẩu hiện tại' }).min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string({ error: 'Vui lòng nhập mật khẩu mới' }).min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
  })
};

// 2. Job Schemas
// Các trường khớp với cột bảng jobs trong job_system.sql và jobController
const JOB_TYPES = ['internship', 'full_time', 'part_time'];
const JOB_STATUSES = ['pending', 'approved', 'rejected', 'closed'];
const optionalNumber = z.coerce.number().nullish();

const jobFields = {
  requirements: z.string().nullish(),
  benefits: z.string().nullish(),
  location: z.string().nullish(),
  category_id: optionalNumber,
  salary_min: optionalNumber,
  salary_max: optionalNumber,
  salary_negotiable: z.union([z.boolean(), z.number()]).optional(),
  quantity: optionalNumber,
  deadline: z.string().nullish(),
  company_id: optionalNumber,
  status: z.enum(JOB_STATUSES).optional()
};

const jobSchemas = {
  createJob: z.object({
    title: z.string({ error: 'Vui lòng nhập tiêu đề tin tuyển dụng' }).min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
    description: z.string({ error: 'Vui lòng nhập mô tả công việc' }).min(10, 'Mô tả công việc phải có ít nhất 10 ký tự'),
    job_type: z.enum(JOB_TYPES, { error: 'Loại hình công việc không hợp lệ' }).default('internship'),
    ...jobFields
  }),

  updateJob: z.object({
    title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự').optional(),
    description: z.string().min(10, 'Mô tả phải có ít nhất 10 ký tự').optional(),
    job_type: z.enum(JOB_TYPES, { error: 'Loại hình công việc không hợp lệ' }).optional(),
    ...jobFields
  }),

  updateJobStatus: z.object({
    status: z.enum(JOB_STATUSES, {
      error: 'Vui lòng chọn trạng thái tin tuyển dụng'
    }),
    reject_reason: z.string().nullish()
  })
};

// 3. Application Schemas
const applicationSchemas = {
  applyJob: z.object({
    job_id: z.coerce.number({ error: 'Vui lòng chọn việc làm để nộp' }).positive('ID việc làm không hợp lệ'),
    cv_id: z.coerce.number({ error: 'Vui lòng chọn CV để nộp' }).positive('ID CV không hợp lệ'),
    cover_letter: z.string().optional().nullable()
  }),

  updateStatus: z.object({
    status: z.enum(['submitted', 'viewed', 'interview', 'accepted', 'rejected'], {
      error: 'Vui lòng chọn trạng thái ứng tuyển hợp lệ'
    }),
    note: z.string().optional().nullable()
  })
};

// 4. Interview Schemas
const interviewSchemas = {
  scheduleInterview: z.object({
    application_id: z.coerce.number({ error: 'Vui lòng chọn đơn ứng tuyển' }).positive('ID đơn ứng tuyển không hợp lệ'),
    scheduled_at: z.string({ error: 'Vui lòng chọn thời gian phỏng vấn' }).min(1, 'Thời gian phỏng vấn không được để trống'),
    format: z.enum(['online', 'offline']).optional().default('online'),
    location: z.string({ error: 'Vui lòng cung cấp link hoặc địa điểm phỏng vấn' }).min(1, 'Địa điểm hoặc liên kết phỏng vấn không được để trống'),
    note: z.string().optional().nullable()
  }),

  updateStatus: z.object({
    status: z.enum(['scheduled', 'confirmed', 'declined', 'cancelled', 'done'], {
      error: 'Vui lòng chọn trạng thái phỏng vấn'
    }),
    note: z.string().optional().nullable()
  })
};

// 5. Review Schemas
const reviewSchemas = {
  addReview: z.object({
    rating: z.union([z.number(), z.string()]).transform((val, ctx) => {
      const parsed = typeof val === 'string' ? Number(val) : val;
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Điểm đánh giá phải là số nguyên từ 1 đến 5'
        });
        return z.NEVER;
      }
      return parsed;
    }),
    comment: z.string({ error: 'Vui lòng nhập nhận xét' })
      .min(5, 'Nhận xét phải có ít nhất 5 ký tự')
      .max(1000, 'Nhận xét không được vượt quá 1000 ký tự')
  })
};

// 6. CV Schemas
const cvSchemas = {
  createCV: z.object({
    title: z.string({ error: 'Vui lòng nhập tiêu đề CV' }).min(1, 'Tiêu đề CV không được để trống'),
    content: z.union([z.string(), z.record(z.any())]).optional().nullable(),
    is_default: z.union([z.boolean(), z.number()]).optional().default(0)
  }),

  updateCV: z.object({
    title: z.string().min(1, 'Tiêu đề CV không được để trống').optional(),
    content: z.union([z.string(), z.record(z.any())]).optional().nullable(),
    is_default: z.union([z.boolean(), z.number()]).optional()
  })
};

// 7. Chatbot Schemas
const chatbotSchemas = {
  chat: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['user', 'model'], { error: 'role phải là user hoặc model' }),
        text: z.string({ error: 'Vui lòng nhập tin nhắn' })
          .trim()
          .min(1, 'Tin nhắn không được để trống')
          .max(1000, 'Tin nhắn không được vượt quá 1000 ký tự')
      }),
      { error: 'Thiếu danh sách tin nhắn' }
    )
      .min(1, 'Thiếu danh sách tin nhắn')
      .max(20, 'Hội thoại quá dài, vui lòng bắt đầu cuộc trò chuyện mới')
      .refine((msgs) => msgs[msgs.length - 1].role === 'user', 'Tin nhắn cuối phải là của người dùng')
  })
};

module.exports = {
  validate,
  authSchemas,
  jobSchemas,
  applicationSchemas,
  interviewSchemas,
  reviewSchemas,
  cvSchemas,
  chatbotSchemas
};
