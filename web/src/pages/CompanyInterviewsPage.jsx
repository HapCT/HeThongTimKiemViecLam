import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Select,
  message,
  Avatar
} from 'antd';
import {
  CalendarOutlined,
  VideoCameraOutlined,
  UserOutlined
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CompanyInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interviews/company');
      if (res?.data) {
        setInterviews(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/interviews/${id}/status`, { status });
      message.success('Đã cập nhật trạng thái phỏng vấn');
      fetchInterviews();
    } catch (err) {
      message.error(err.message);
    }
  };

  const statusConfig = {
    scheduled: { color: 'blue', text: 'Chờ diễn ra' },
    confirmed: { color: 'green', text: 'Ứng viên xác nhận' },
    declined: { color: 'red', text: 'Ứng viên từ chối' },
    cancelled: { color: 'default', text: 'Đã hủy' },
    done: { color: 'purple', text: 'Đã hoàn thành' }
  };

  const columns = [
    {
      title: 'Ứng viên',
      key: 'candidate',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar src={record.candidate_avatar} icon={<UserOutlined />} style={{ background: '#2563eb' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.candidate_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.candidate_phone}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Vị trí phỏng vấn',
      dataIndex: 'job_title',
      key: 'job_title',
      render: (t) => <strong>{t}</strong>
    },
    {
      title: 'Thời gian',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(d).toLocaleString('vi-VN')}</div>
        </div>
      )
    },
    {
      title: 'Hình thức & Đường dẫn',
      key: 'location',
      render: (_, record) => (
        <div>
          <Tag color="cyan">{record.format === 'online' ? 'Google Meet' : 'Trực tiếp'}</Tag>
          {record.location?.startsWith('http') ? (
            <a href={record.location} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
              Vào phòng họp
            </a>
          ) : (
            <span style={{ fontSize: 12, color: '#64748b' }}>{record.location}</span>
          )}
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          size="small"
          value={status}
          onChange={(newStatus) => updateStatus(record.id, newStatus)}
          style={{ width: 140 }}
        >
          <Option value="scheduled">Chờ diễn ra</Option>
          <Option value="confirmed">Đã xác nhận</Option>
          <Option value="done">Hoàn thành</Option>
          <Option value="cancelled">Hủy lịch</Option>
        </Select>
      )
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Lịch phỏng vấn đã xếp
          </Title>
          <Text type="secondary">
            Theo dõi danh sách các buổi phỏng vấn trực tuyến và trực tiếp cùng sinh viên
          </Text>
        </div>

        <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 20 }}>
          <Table
            columns={columns}
            dataSource={interviews}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>
    </div>
  );
}
