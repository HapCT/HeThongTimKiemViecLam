import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Tag,
  Typography,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Descriptions,
  message
} from 'antd';
import {
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  PhoneOutlined,
  UserOutlined,
  SendOutlined,
  HeartOutlined,
  HeartFilled,
  BankOutlined,
  CheckCircleFilled,
  ExportOutlined
} from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ApplyModal from './ApplyModal';

const { Title, Paragraph, Text } = Typography;

export default function JobDetailModal({ visible, job: initialJob, onClose, onRefresh }) {
  const navigate = useNavigate();
  const { isCandidate, user } = useAuth();
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [job, setJob] = useState(initialJob);
  const [saved, setSaved] = useState(Boolean(initialJob?.is_saved));

  useEffect(() => {
    if (visible && initialJob?.id) {
      setJob(initialJob);
      setSaved(Boolean(initialJob.is_saved));

      // Gọi API GET /api/jobs/:id để tự động tăng lượt xem (view_count + 1) và lấy thông tin mới nhất
      api.get(`/jobs/${initialJob.id}`)
        .then((res) => {
          if (res?.data) {
            setJob(res.data);
            setSaved(Boolean(res.data.is_saved));
          }
        })
        .catch((err) => console.error('Fetch job error:', err));
    }
  }, [visible, initialJob?.id]);

  const handleClose = () => {
    onClose && onClose();
    onRefresh && onRefresh();
  };

  if (!job) return null;

  const formatSalary = () => {
    if (job.salary_negotiable) return 'Thỏa thuận';
    if (job.salary_min && job.salary_max) {
      return `${(job.salary_min / 1000000).toLocaleString()} - ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ / tháng`;
    }
    if (job.salary_min) return `Từ ${(job.salary_min / 1000000).toLocaleString()} triệu VNĐ`;
    if (job.salary_max) return `Tới ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ`;
    return 'Thỏa thuận';
  };

  const handleToggleSave = async () => {
    if (!isCandidate) {
      message.warning('Vui lòng chọn vai trò Sinh viên để lưu việc làm');
      return;
    }
    try {
      const res = await api.post('/saved-jobs/toggle', { job_id: job.id });
      if (res?.data) {
        setSaved(res.data.is_saved);
        message.success(res.message);
        onRefresh && onRefresh();
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <>
      <Modal
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={820}
        style={{ top: 24 }}
        bodyStyle={{ maxHeight: '82vh', overflowY: 'auto', padding: 28 }}
      >
        {/* Header Header Info */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              flexShrink: 0,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6
            }}
          >
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <BankOutlined style={{ fontSize: 32, color: '#2563eb' }} />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              {job.title}
            </Title>
            <div
              onClick={() => {
                if (job.company_id) {
                  handleClose();
                  navigate(`/companies/${job.company_id}`);
                }
              }}
              style={{
                fontSize: 15,
                color: '#2563eb',
                fontWeight: 600,
                marginTop: 4,
                cursor: job.company_id ? 'pointer' : 'default',
                display: 'inline-block'
              }}
            >
              {job.company_name}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                {job.job_type === 'internship' ? 'Thực tập sinh' : job.job_type === 'full_time' ? 'Toàn thời gian' : 'Bán thời gian'}
              </Tag>
              {job.category_name && (
                <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600 }}>
                  {job.category_name}
                </Tag>
              )}
              <Tag color="green" style={{ borderRadius: 6, fontWeight: 700 }}>
                {formatSalary()}
              </Tag>
              <Tag icon={<EnvironmentOutlined />} style={{ borderRadius: 6 }}>
                {job.location}
              </Tag>
            </div>
          </div>
        </div>

        {/* Quick highlight bar */}
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 24,
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Hạn nộp hồ sơ</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {job.deadline ? (
                (job.status === 'closed' || new Date(job.deadline) < new Date(new Date().toDateString())) ? (
                  <Tag color="error" style={{ borderRadius: 4, fontWeight: 700, margin: 0 }}>
                    Đã hết hạn ({new Date(job.deadline).toLocaleDateString('vi-VN')})
                  </Tag>
                ) : (
                  new Date(job.deadline).toLocaleDateString('vi-VN')
                )
              ) : 'Tuyển liên tục'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Số lượng tuyển</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{job.quantity || 1} người</div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Lượt xem</div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{job.view_count || 1} lượt</div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                handleClose();
                navigate(`/jobs/${job.id}`);
              }}
            >
              Xem trang riêng
            </Button>

            <Button
              icon={saved ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
              onClick={handleToggleSave}
            >
              {saved ? 'Đã lưu' : 'Lưu tin'}
            </Button>

            {job.application_status ? (
              <Button type="primary" disabled style={{ background: '#059669', borderColor: '#059669' }}>
                <CheckCircleFilled /> Đã ứng tuyển ({job.application_status})
              </Button>
            ) : (job.status === 'closed' || (job.deadline && new Date(job.deadline) < new Date(new Date().toDateString()))) ? (
              <Button disabled style={{ background: '#f1f5f9', color: '#94a3b8', borderColor: '#cbd5e1', fontWeight: 600 }}>
                Đã hết hạn nộp hồ sơ
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{ background: '#2563eb' }}
                onClick={() => setApplyModalOpen(true)}
              >
                Ứng tuyển ngay
              </Button>
            )}
          </div>
        </div>

        {/* Job Description */}
        <div style={{ marginBottom: 20 }}>
          <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 10 }}>
            Mô tả công việc
          </Title>
          <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.8, fontSize: 14 }}>
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div style={{ marginBottom: 20 }}>
            <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 10 }}>
              Yêu cầu ứng viên
            </Title>
            <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.8, fontSize: 14 }}>
              {job.requirements}
            </div>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 10 }}>
              Quyền lợi được hưởng
            </Title>
            <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.8, fontSize: 14 }}>
              {job.benefits}
            </div>
          </div>
        )}

        <Divider />

        {/* Company Info */}
        <div>
          <Title level={5} style={{ color: '#0f172a', marginBottom: 12 }}>
            Về công ty {job.company_name}
          </Title>
          <Row gutter={[16, 12]} style={{ fontSize: 14 }}>
            {job.company_address && (
              <Col span={24}>
                <EnvironmentOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                <strong>Địa chỉ:</strong> {job.company_address}
              </Col>
            )}
            {job.company_website && (
              <Col xs={24} md={12}>
                <GlobalOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                <strong>Website:</strong>{' '}
                <a href={job.company_website} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                  {job.company_website}
                </a>
              </Col>
            )}
            {job.company_phone && (
              <Col xs={24} md={12}>
                <PhoneOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                <strong>Điện thoại:</strong> {job.company_phone}
              </Col>
            )}
            {job.company_description && (
              <Col span={24} style={{ marginTop: 8, color: '#64748b', lineHeight: 1.6 }}>
                {job.company_description}
              </Col>
            )}
          </Row>
        </div>
      </Modal>

      {/* Apply Modal */}
      <ApplyModal
        visible={applyModalOpen}
        job={job}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          onRefresh && onRefresh();
          onClose();
        }}
      />
    </>
  );
}
