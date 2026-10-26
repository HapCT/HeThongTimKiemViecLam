import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Button,
  Empty,
  Spin,
  Space,
  message,
  Divider
} from 'antd';
import {
  CalendarOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function CandidateInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchInterviews() {
    setLoading(true);
    try {
      const res = await api.get('/interviews/candidate');
      if (res?.data) {
        setInterviews(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInterviews();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/interviews/${id}/status`, { status });
      message.success(`Đã cập nhật trạng thái phỏng vấn: ${status}`);
      fetchInterviews();
    } catch (err) {
      message.error(err.message);
    }
  };

  const statusConfig = {
    scheduled: { color: 'blue', text: 'Chờ diễn ra' },
    confirmed: { color: 'green', text: 'Đã xác nhận tham gia' },
    declined: { color: 'red', text: 'Đã từ chối' },
    cancelled: { color: 'default', text: 'Đã hủy' },
    done: { color: 'purple', text: 'Đã hoàn thành' }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Lịch phỏng vấn của tôi
          </Title>
          <Text type="secondary">
            Xem thông tin phòng họp trực tuyến và quản lý các lịch hẹn phỏng vấn từ nhà tuyển dụng
          </Text>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : interviews.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '60px 0' }}>
            <Empty description="Bạn chưa có lịch phỏng vấn nào." />
          </Card>
        ) : (
          <Row gutter={[20, 20]}>
            {interviews.map((item) => (
              <Col xs={24} md={12} key={item.id}>
                <Card
                  style={{
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#0f172a', fontWeight: 700 }}>
                        {item.job_title}
                      </Title>
                      <div style={{ color: '#2563eb', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                        {item.company_name}
                      </div>
                    </div>
                    <Tag color={statusConfig[item.status]?.color || 'blue'} style={{ borderRadius: 6, fontWeight: 700 }}>
                      {statusConfig[item.status]?.text || item.status}
                    </Tag>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, marginBottom: 6 }}>
                      <CalendarOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                      <strong>Thời gian:</strong>{' '}
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>
                        {new Date(item.scheduled_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 6 }}>
                      <VideoCameraOutlined style={{ color: '#10b981', marginRight: 8 }} />
                      <strong>Hình thức:</strong>{' '}
                      {item.format === 'online' ? 'Trực tuyến (Google Meet)' : 'Trực tiếp tại trụ sở'}
                    </div>

                    <div style={{ fontSize: 13 }}>
                      <EnvironmentOutlined style={{ color: '#6366f1', marginRight: 8 }} />
                      <strong>Địa điểm / Đường dẫn:</strong>{' '}
                      {item.location?.startsWith('http') ? (
                        <a href={item.location} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: '#2563eb' }}>
                          {item.location} (Nhấp để vào phòng)
                        </a>
                      ) : (
                        item.location
                      )}
                    </div>
                  </div>

                  {item.note && (
                    <Paragraph style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
                      <strong>Ghi chú:</strong> {item.note}
                    </Paragraph>
                  )}

                  <Divider style={{ margin: '14px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.location?.startsWith('http') ? (
                      <Button
                        type="primary"
                        icon={<VideoCameraOutlined />}
                        href={item.location}
                        target="_blank"
                        style={{ background: '#059669', borderColor: '#059669', borderRadius: 8 }}
                      >
                        Tham gia phỏng vấn
                      </Button>
                    ) : (
                      <span />
                    )}

                    <Space>
                      {item.status === 'scheduled' && (
                        <>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => updateStatus(item.id, 'confirmed')}
                            style={{ background: '#2563eb', borderRadius: 6 }}
                          >
                            Xác nhận tham gia
                          </Button>
                          <Button
                            size="small"
                            danger
                            onClick={() => updateStatus(item.id, 'declined')}
                            style={{ borderRadius: 6 }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
