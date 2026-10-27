const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { validate, chatbotSchemas } = require('../middlewares/validate');

// Mỗi tin nhắn tốn một lượt gọi Gemini nên giới hạn chặt hơn các API khác
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 20, // Tối đa 20 tin nhắn mỗi IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Bạn đã hỏi quá nhiều, vui lòng thử lại sau 15 phút' }
});

router.post('/', chatbotLimiter, validate(chatbotSchemas.chat), chatbotController.chat);

module.exports = router;
