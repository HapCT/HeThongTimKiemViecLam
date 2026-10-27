const chatbotService = require('../services/chatbotService');

// Chỉ gửi 10 tin gần nhất cho Gemini để giới hạn chi phí
const HISTORY_LIMIT = 10;

// POST /api/chatbot
exports.chat = async (req, res) => {
  if (!chatbotService.isConfigured()) {
    return res.status(503).json({ success: false, message: 'Chatbot chưa được cấu hình trên máy chủ' });
  }

  // Gemini yêu cầu hội thoại bắt đầu bằng tin của người dùng
  const history = req.body.messages.slice(-HISTORY_LIMIT);
  while (history[0].role !== 'user') history.shift();

  try {
    const data = await chatbotService.chat(history);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('chatbot error:', error.message);
    return res.status(502).json({ success: false, message: 'Trợ lý đang bận, vui lòng thử lại sau ít phút' });
  }
};
