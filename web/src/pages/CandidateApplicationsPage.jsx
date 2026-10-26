import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Modal,
  Alert,
  Descriptions,
  message
} from 'antd';
import {
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BankOutlined
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await api.get('/applications/my-applications');
      if (res?.data) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateInterviewStatus = async (interviewId, status) => {
    try {
      await api.patch(`/interviews/${interviewId}/status`, { status });
      message.success(
        status === 'confirmed'
          ? 'Đã xác nhận tham gia phỏng vấn thành công!'
          : 'Đã từ chối tham gia phỏng vấn'
      );
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      message.error(err.message || 'Lỗi khi cập nhật trạng thái phỏng vấn');
    }
  };

  const statusConfig = {
    submitted: { color: 'gold', text: 'Đã nộp hồ sơ', icon: <ClockCircleOutlined /> },
    viewed: { color: 'blue', text: 'Doanh nghiệp đã xem', icon: <EyeOutlined /> },
    interview: { color: 'purple', text: 'Mời phỏng vấn', icon: <CalendarOutlined /> },
    accepted: { color: 'green', text: 'Trúng tuyển / Tiếp nhận', icon: <CheckCircleOutlined /> },
    rejected: { color: 'red', text: 'Từ chối hồ sơ', icon: <CloseCircleOutlined /> }
  };

  const columns = [
    {
      title: 'Vị trí ứng tuyển & Doanh nghiệp',
      key: 'job',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              flexShrink: 0
            }}
          >
            {record.company_logo ? (
              <img src={record.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <BankOutlined style={{ fontSize: 20, color: '#2563eb' }} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{record.job_title}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.company_name}</div>
          </div>
        </div>
      )
    },
    {
      title: 'CV đã sử dụng',
      dataIndex: 'cv_title',
      key: 'cv_title',
      render: (text) => <span style={{ fontWeight: 600, color: '#2563eb' }}>{text}</span>
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'applied_at',
      key: 'applied_at',
      render: (date) => new Date(date).toLocaleString('vi-VN')
    },
    {
      title: 'Trạng thái xét duyệt',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const conf = statusConfig[status] || { color: 'default', text: status };
        return (
          <Tag color={conf.color} icon={conf.icon} style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px' }}>
            {conf.text}
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size={8} wrap>
          {record.interview_id && record.interview_status === 'scheduled' && (
            <>
              <Button
                size="small"
                type="primary"
                style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 6, fontWeight: 700 }}
                onClick={() => handleUpdateInterviewStatus(record.interview_id, 'confirmed')}
              >
                Xác nhận
              </Button>
              <Button
                size="small"
                danger
                style={{ borderRadius: 6 }}
                onClick={() => handleUpdateInterviewStatus(record.interview_id, 'declined')}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.interview_status === 'confirmed' && (
            <Tag color="green" style={{ fontWeight: 700 }}>Đã xác nhận</Tag>
          )}
          {record.interview_status === 'declined' && (
            <Tag color="red" style={{ fontWeight: 700 }}>Đã từ chối</Tag>
          )}
          <Button type="link" onClick={() => setSelectedApp(record)} style={{ padding: 0 }}>
            Chi tiết
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Lịch sử & Tiến trình ứng tuyển
          </Title>
          <Text type="secondary">
            Theo dõi trạng thái phản hồi và lịch phỏng vấn từ các nhà tuyển dụng
          </Text>
        </div>

        <Card
          style={{
            borderRadius: 16,
            border: '1px solid #e2e8f0'
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>

      {/* Application Detail Modal */}
      <Modal
        open={Boolean(selectedApp)}
        title="Chi tiết đơn ứng tuyển"
        onCancel={() => setSelectedApp(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedApp(null)}>
            Đóng
          </Button>
        ]}
        width={650}
      >
        {selectedApp && (
          <div style={{ padding: '8px 0' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Công việc">{selectedApp.job_title}</Descriptions.Item>
              <Descriptions.Item label="Công ty">{selectedApp.company_name}</Descriptions.Item>
              <Descriptions.Item label="CV ứng tuyển">{selectedApp.cv_title}</Descriptions.Item>
              <Descriptions.Item label="Ngày nộp">
                {new Date(selectedApp.applied_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusConfig[selectedApp.status]?.color || 'blue'}>
                  {statusConfig[selectedApp.status]?.text || selectedApp.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lời nhắn ứng viên">
                {selectedApp.cover_letter || 'Không có'}
              </Descriptions.Item>
              {selectedApp.note && (
                <Descriptions.Item label="Ghi chú từ công ty">
                  <span style={{ color: '#059669', fontWeight: 600 }}>{selectedApp.note}</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Scheduled Interview Info if exists */}
            {selectedApp.interview_time && (
              <Alert
                type="info"
                showIcon
                icon={<CalendarOutlined />}
                message="Lịch phỏng vấn đã được xếp"
                description={
                  <div style={{ marginTop: 8 }}>
                    <div>
                      <strong>Thời gian:</strong>{' '}
                      {new Date(selectedApp.interview_time).toLocaleString('vi-VN')}
                    </div>
                    <div>
                      <strong>Hình thức:</strong>{' '}
                      {selectedApp.interview_format === 'online' ? 'Trực tuyến (Google Meet)' : 'Trực tiếp tại văn phòng'}
                    </div>
                    <div>
                      <strong>Địa điểm / Link họp:</strong>{' '}
                      {selectedApp.interview_location.startsWith('http') ? (
                        <a href={selectedApp.interview_location} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                          {selectedApp.interview_location}
                        </a>
                      ) : (
                        selectedApp.interview_location
                      )}
                    </div>
                    {selectedApp.interview_note && (
                      <div style={{ marginTop: 4, color: '#475569' }}>
                        <strong>Ghi chú:</strong> {selectedApp.interview_note}
                      </div>
                    )}

                    {selectedApp.interview_status === 'scheduled' && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #bfdbfe' }}>
                        <Space size={10}>
                          <Button
                            type="primary"
                            style={{ background: '#16a34a', borderColor: '#16a34a', borderRadius: 8, fontWeight: 700 }}
                            onClick={() => handleUpdateInterviewStatus(selectedApp.interview_id, 'confirmed')}
                          >
                            Xác nhận tham gia phỏng vấn
                          </Button>
                          <Button
                            danger
                            style={{ borderRadius: 8, fontWeight: 600 }}
                            onClick={() => handleUpdateInterviewStatus(selectedApp.interview_id, 'declined')}
                          >
                            Từ chối phỏng vấn
                          </Button>
                        </Space>
                      </div>
                    )}

                    {selectedApp.interview_status === 'confirmed' && (
                      <div style={{ marginTop: 12 }}>
                        <Tag color="green" style={{ fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
                          BẠN ĐÃ XÁC NHẬN THAM GIA BUỔI PHỎNG VẤN NÀY
                        </Tag>
                      </div>
                    )}

                    {selectedApp.interview_status === 'declined' && (
                      <div style={{ marginTop: 12 }}>
                        <Tag color="red" style={{ fontWeight: 700, padding: '4px 10px', borderRadius: 6 }}>
                          BẠN ĐÃ TỪ CHỐI BUỔI PHỎNG VẤN NÀY
                        </Tag>
                      </div>
                    )}
                  </div>
                }
                style={{ marginTop: 20 }}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
