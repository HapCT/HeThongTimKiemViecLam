require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool } = require('./config/db');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request từ mobile app hoặc dev tool không gửi header origin, hoặc origin nằm trong danh sách
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Chặn bởi chính sách CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500, // Tối đa 500 requests mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 50, // Tối đa 50 requests mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 15 phút' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static files: chỉ công khai thư mục ảnh (avatars, logos)
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));

// Protected CV files: bảo vệ có kiểm soát quyền truy cập qua middleware authenticate
const { authenticate } = require('./middlewares/auth');
const candidateController = require('./controllers/candidateController');
app.get('/uploads/cvs/:filename', authenticate, candidateController.serveCVFile);
app.get('/api/candidates/cvs/file/:filename', authenticate, candidateController.serveCVFile);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng bạn đến với API Hệ thống Tìm kiếm Việc làm & Thực tập UTEHY',
    version: '1.0.0',
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', time: new Date() });
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as connected');
    res.json({
      status: 'UP',
      database: rows.length > 0 ? 'Connected' : 'Disconnected',
      time: new Date()
    });
  } catch (err) {
    res.status(500).json({ status: 'DOWN', error: err.message });
  }
});

// Route imports
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const companyRoutes = require('./routes/companyRoutes');
const savedJobRoutes = require('./routes/savedJobRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/saved-jobs', savedJobRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} không tồn tại` });
});

// Multer Error Handler (bắt lỗi file quá lớn hoặc sai định dạng trả về 400 tiếng Việt)
const multer = require('multer');
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Dung lượng tệp tải lên vượt quá giới hạn cho phép' });
    }
    return res.status(400).json({ success: false, message: `Lỗi tải tệp: ${err.message}` });
  }
  if (err && err.message && (err.message.includes('Chỉ chấp nhận') || err.message.includes('định dạng'))) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  // Lỗi 500 chỉ trả về thông báo chung, không để lộ thông tin nhạy cảm err.message ra ngoài
  const message = status === 500 ? 'Lỗi hệ thống máy chủ' : (err.message || 'Lỗi xử lý yêu cầu');
  res.status(status).json({
    success: false,
    message
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Server đang chạy tại: http://localhost:${PORT}`);
  console.log(` Hệ thống tìm kiếm việc làm & thực tập sinh viên`);
  console.log(`====================================================`);
});
