import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, FloatButton, Input, Space, Tag, Typography } from 'antd';
import { CloseOutlined, EnvironmentOutlined, RobotOutlined, SendOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Text } = Typography;

// Server nhận tối đa 20 tin mỗi lần gọi
const MAX_HISTORY = 20;

const SUGGESTIONS = ['Tìm thực tập React ở Hà Nội', 'Việc bán thời gian lương từ 5 triệu', 'Có tin tuyển Tester nào không?'];

const jobTypeLabels = {
  internship: 'Thực tập',
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian'
};

function formatSalary(job) {
  if (job.salary_negotiable || (!job.salary_min && !job.salary_max)) return 'Thỏa thuận';
  const toMillion = (v) => (v / 1000000).toLocaleString();
  if (job.salary_min && job.salary_max) return `${toMillion(job.salary_min)} - ${toMillion(job.salary_max)} triệu`;
  return job.salary_min ? `Từ ${toMillion(job.salary_min)} triệu` : `Tới ${toMillion(job.salary_max)} triệu`;
}

function ChatJobCard({ job, onOpen }) {
  return (
    <Card size="small" hoverable onClick={() => onOpen(job.id)} style={{ marginTop: 8 }} styles={{ body: { padding: 10 } }}>
      <Text strong style={{ display: 'block', lineHeight: 1.35 }}>{job.title}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>{job.company_name}</Text>
      <Space size={4} wrap style={{ marginTop: 6 }}>
        <Tag color="blue" style={{ margin: 0 }}>{jobTypeLabels[job.job_type] || job.job_type}</Tag>
        <Tag style={{ margin: 0 }}><EnvironmentOutlined /> {job.location}</Tag>
        <Tag color="green" style={{ margin: 0 }}>{formatSalary(job)}</Tag>
      </Space>
    </Card>
  );
}

function MessageBubble({ message, onOpenJob }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <div style={{ maxWidth: '88%' }}>
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 12,
            whiteSpace: 'pre-wrap',
            background: message.error ? '#fef2f2' : isUser ? '#2563eb' : '#f1f5f9',
            color: message.error ? '#b91c1c' : isUser ? '#ffffff' : '#0f172a'
          }}
        >
          {message.text}
        </div>
        {message.jobs?.map((job) => (
          <ChatJobCard key={job.id} job={job} onOpen={onOpenJob} />
        ))}
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, open]);

  async function send(text) {
    const content = text.trim();
    if (!content || sending) return;

    const next = [...messages, { role: 'user', text: content }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      // Tin báo lỗi chỉ để hiển thị, không gửi lại cho bot
      const history = next.filter((m) => !m.error).slice(-MAX_HISTORY).map(({ role, text: t }) => ({ role, text: t }));
      const res = await api.post('/chatbot', { messages: history }, { timeout: 70000 });
      setMessages((prev) => [...prev, { role: 'model', text: res.data.reply, jobs: res.data.jobs }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'model', text: err.message, error: true }]);
    } finally {
      setSending(false);
    }
  }

  function openJob(id) {
    navigate(`/jobs/${id}`);
  }

  if (!open) {
    return (
      <FloatButton
        type="primary"
        icon={<RobotOutlined />}
        tooltip="Trợ lý tìm việc"
        onClick={() => setOpen(true)}
        style={{ insetInlineEnd: 24, insetBlockEnd: 24 }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1000,
        width: 'min(380px, calc(100vw - 32px))',
        height: 'min(560px, calc(100vh - 96px))',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#2563eb', color: '#ffffff' }}>
        <RobotOutlined style={{ fontSize: 18 }} />
        <span style={{ fontWeight: 700, flex: 1 }}>Trợ lý tìm việc</span>
        <Button type="text" size="small" icon={<CloseOutlined style={{ color: '#ffffff' }} />} onClick={() => setOpen(false)} aria-label="Đóng" />
      </div>

      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        <MessageBubble
          message={{ role: 'model', text: 'Chào bạn! Mình giúp bạn tìm việc làm, thực tập trên hệ thống. Bạn muốn tìm vị trí gì, ở đâu?' }}
          onOpenJob={openJob}
        />
        {messages.length === 0 && (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {SUGGESTIONS.map((s) => (
              <Button key={s} size="small" onClick={() => send(s)} style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal' }}>
                {s}
              </Button>
            ))}
          </Space>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} onOpenJob={openJob} />
        ))}
        {sending && <Text type="secondary" style={{ fontSize: 13 }}>Đang tìm...</Text>}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8f0' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => send(input)}
          placeholder="Nhập câu hỏi..."
          maxLength={1000}
          disabled={sending}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={() => send(input)} loading={sending} aria-label="Gửi" />
      </div>
    </div>
  );
}
