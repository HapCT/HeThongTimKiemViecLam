import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Button,
  Breadcrumb,
  Spin,
  Empty,
  Divider,
  Space,
  message,
  Tooltip,
  Alert
} from 'antd';
import {
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  PhoneOutlined,
  BankOutlined,
  SendOutlined,
  HeartOutlined,
  HeartFilled,
  ShareAltOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  UsergroupAddOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  RightOutlined
} from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ApplyModal from '../components/ApplyModal';
import JobCard from '../components/JobCard';

const { Title, Paragraph, Text } = Typography;

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCandidate, user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (id) {
      window.scrollTo(0, 0);
      fetchJobDetail();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/jobs/${id}`);
      if (res?.data) {
        setJob(res.data);
        setSaved(Boolean(res.data.is_saved));

        // Fetch related jobs in same category
        if (res.data.category_id) {
          fetchRelatedJobs(res.data.category_id, res.data.id);
        }
      }
    } catch (err) {
      console.error('Fetch job error:', err);
      message.error('Không thể tải thông tin tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedJobs = async (categoryId, currentJobId) => {
    setLoadingRelated(true);
    try {
      const res = await api.get(`/jobs?category_id=${categoryId}&limit=4`);
      if (res?.data?.jobs) {
        // filter out current job
        const filtered = res.data.jobs.filter((j) => String(j.id) !== String(currentJobId));
        setRelatedJobs(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error('Fetch related jobs error:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const formatSalary = () => {
    if (!job) return 'Thỏa thuận';
    if (job.salary_negotiable) return 'Thỏa thuận';
    if (job.salary_min && job.salary_max) {
      return `${(job.salary_min / 1000000).toLocaleString()} - ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ / tháng`;
    }
    if (job.salary_min) return `Từ ${(job.salary_min / 1000000).toLocaleString()} triệu VNĐ / tháng`;
    if (job.salary_max) return `Tới ${(job.salary_max / 1000000).toLocaleString()} triệu VNĐ / tháng`;
    return 'Thỏa thuận';
  };

  const handleToggleSave = async () => {
    if (!isCandidate) {
      message.warning('Vui lòng chọn vai trò Sinh viên để lưu việc làm');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/saved-jobs/toggle', { job_id: job.id });
      if (res?.data) {
        setSaved(res.data.is_saved);
        message.success(res.message);
      }
    } catch (err) {
      message.error(err.message || 'Lỗi khi cập nhật trạng thái lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Đã sao chép liên kết tin tuyển dụng vào bộ nhớ tạm!');
  };

  const isExpired = job && (
    job.status === 'closed' ||
    (job.deadline && new Date(job.deadline) < new Date(new Date().toDateString()))
  );

  const jobTypeLabels = {
    internship: { text: 'Thực tập sinh (Internship)', color: 'blue' },
    full_time: { text: 'Toàn thời gian (Full-time)', color: 'green' },
    part_time: { text: 'Bán thời gian (Part-time)', color: 'orange' }
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '100px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748b' }}>Đang tải thông tin tin tuyển dụng...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '80px 0' }}>
        <div className="app-container" style={{ textAlign: 'center' }}>
          <Empty description="Không tìm thấy thông tin tin tuyển dụng này hoặc tin đã bị gỡ." />
          <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 20 }}>
            Quay lại danh sách việc làm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '24px 0 60px' }}>
      <div className="app-container">
        {/* Breadcrumb & Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Breadcrumb
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/jobs">Tìm việc làm</Link> },
              { title: job.category_name ? <Link to={`/jobs?category_id=${job.category_id}`}>{job.category_name}</Link> : 'Chi tiết' },
              { title: <span style={{ color: '#0f172a', fontWeight: 600 }}>{job.title}</span> }
            ]}
          />
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/jobs')}
            style={{ fontWeight: 600, color: '#2563eb' }}
          >
            Quay lại danh sách
          </Button>
        </div>

        {/* Hero Card: Job Title & Main Actions */}
        <Card
          style={{
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            marginBottom: 24,
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
          }}
          bodyStyle={{ padding: 28 }}
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Company Logo */}
            <div
              onClick={() => job.company_id && navigate(`/companies/${job.company_id}`)}
              style={{
                width: 90,
                height: 90,
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                cursor: job.company_id ? 'pointer' : 'default',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
              }}
            >
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company_name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/120x120?text=Logo';
                  }}
                />
              ) : (
                <BankOutlined style={{ fontSize: 40, color: '#2563eb' }} />
              )}
            </div>

            {/* Title & Info */}
            <div style={{ flex: '1 1 380px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: 24, lineHeight: 1.3 }}>
                  {job.title}
                </Title>
              </div>

              <div style={{ marginTop: 6, fontSize: 16 }}>
                <span
                  onClick={() => job.company_id && navigate(`/companies/${job.company_id}`)}
                  style={{
                    color: '#2563eb',
                    fontWeight: 700,
                    cursor: job.company_id ? 'pointer' : 'default'
                  }}
                >
                  {job.company_name}
                </span>
                {job.company_industry && (
                  <span style={{ color: '#64748b', fontSize: 14 }}> • {job.company_industry}</span>
                )}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'center' }}>
                <Tag color={jobTypeLabels[job.job_type]?.color || 'blue'} style={{ borderRadius: 6, fontWeight: 600, padding: '4px 10px', fontSize: 13 }}>
                  {jobTypeLabels[job.job_type]?.text || job.job_type}
                </Tag>
                {job.category_name && (
                  <Tag color="purple" style={{ borderRadius: 6, fontWeight: 600, padding: '4px 10px', fontSize: 13 }}>
                    <AppstoreOutlined style={{ marginRight: 4 }} />
                    {job.category_name}
                  </Tag>
                )}
                <Tag color="green" style={{ borderRadius: 6, fontWeight: 700, padding: '4px 10px', fontSize: 13 }}>
                  <DollarOutlined style={{ marginRight: 4 }} />
                  {formatSalary()}
                </Tag>
                <Tag style={{ borderRadius: 6, background: '#f1f5f9', color: '#475569', border: 'none', padding: '4px 10px', fontSize: 13 }}>
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#2563eb' }} />
                  {job.location}
                </Tag>
              </div>
            </div>

            {/* Action Buttons Top */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200, alignSelf: 'center' }}>
              {job.application_status ? (
                <Button
                  type="primary"
                  size="large"
                  disabled
                  style={{ background: '#059669', borderColor: '#059669', height: 46, fontWeight: 700, borderRadius: 10 }}
                >
                  <CheckCircleFilled /> ĐÃ ỨNG TUYỂN ({job.application_status.toUpperCase()})
                </Button>
              ) : isExpired ? (
                <Button
                  disabled
                  size="large"
                  style={{ background: '#f1f5f9', color: '#94a3b8', borderColor: '#cbd5e1', fontWeight: 600, height: 46, borderRadius: 10 }}
                >
                  ĐÃ HẾT HẠN NỘP ĐƠN
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  style={{ background: '#2563eb', height: 46, fontWeight: 700, fontSize: 15, borderRadius: 10 }}
                  onClick={() => setApplyModalOpen(true)}
                >
                  Ứng tuyển ngay
                </Button>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  style={{ flex: 1, borderRadius: 8, fontWeight: 600 }}
                  icon={saved ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                  loading={saving}
                  onClick={handleToggleSave}
                >
                  {saved ? 'Đã lưu' : 'Lưu tin'}
                </Button>
                <Tooltip title="Chia sẻ liên kết">
                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    style={{ borderRadius: 8 }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Quick highlight bar */}
          <Divider style={{ margin: '20px 0 16px' }} />

          <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
            <Col xs={12} sm={6}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Hạn nộp hồ sơ</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 2 }}>
                {job.deadline ? (
                  isExpired ? (
                    <Tag color="error" style={{ borderRadius: 4, fontWeight: 700, margin: 0 }}>
                      Đã hết hạn ({new Date(job.deadline).toLocaleDateString('vi-VN')})
                    </Tag>
                  ) : (
                    <span><CalendarOutlined style={{ marginRight: 4, color: '#2563eb' }} />{new Date(job.deadline).toLocaleDateString('vi-VN')}</span>
                  )
                ) : (
                  'Tuyển liên tục'
                )}
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Số lượng cần tuyển</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 2 }}>
                {job.quantity || 1} nhân sự
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Hồ sơ đã ứng tuyển</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 2 }}>
                <UsergroupAddOutlined style={{ marginRight: 4, color: '#059669' }} />
                {job.applicant_count || 0} hồ sơ
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div style={{ fontSize: 12, color: '#64748b' }}>Lượt quan tâm / xem</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginTop: 2 }}>
                <EyeOutlined style={{ marginRight: 4, color: '#3b82f6' }} />
                {job.view_count || 1} lượt
              </div>
            </Col>
          </Row>
        </Card>

        {/* Main Content Layout */}
        <Row gutter={[24, 24]}>
          {/* Left Column: Job Details */}
          <Col xs={24} lg={16}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              bodyStyle={{ padding: 28 }}
            >
              {/* Job Description */}
              <div style={{ marginBottom: 28 }}>
                <Title level={4} style={{ color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: 12, marginBottom: 16 }}>
                  Mô tả công việc
                </Title>
                <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.85, fontSize: 15 }}>
                  {job.description}
                </div>
              </div>

              {/* Requirements */}
              {job.requirements && (
                <div style={{ marginBottom: 28 }}>
                  <Title level={4} style={{ color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: 12, marginBottom: 16 }}>
                    Yêu cầu ứng viên
                  </Title>
                  <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.85, fontSize: 15 }}>
                    {job.requirements}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <div style={{ marginBottom: 28 }}>
                  <Title level={4} style={{ color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: 12, marginBottom: 16 }}>
                    Quyền lợi được hưởng
                  </Title>
                  <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.85, fontSize: 15 }}>
                    {job.benefits}
                  </div>
                </div>
              )}

              {/* Application Guidance */}
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 10 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#2563eb', fontSize: 18 }} />
                  Cách thức ứng tuyển dành cho sinh viên UTEHY
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
                  Ứng viên nhấn nút <strong>"Ứng tuyển ngay"</strong> phía trên để chọn CV trực tuyến đã tạo trên hệ thống hoặc đính kèm lời nhắn tới nhà tuyển dụng.
                  Hồ sơ của bạn sẽ được chuyển thẳng tới phòng nhân sự của <strong>{job.company_name}</strong> và có thể theo dõi tiến độ duyệt tại mục <em>Việc làm đã ứng tuyển</em>.
                </div>
              </div>
            </Card>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={4} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                    Việc làm tương tự cùng ngành nghề
                  </Title>
                  <Link to={`/jobs?category_id=${job.category_id}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                    Xem thêm →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {relatedJobs.map((rj) => (
                    <JobCard
                      key={rj.id}
                      job={rj}
                      onSelect={(targetJob) => navigate(`/jobs/${targetJob.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </Col>

          {/* Right Column: Company Profile & Quick Info */}
          <Col xs={24} lg={8}>
            {/* Company Card */}
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    flexShrink: 0,
                    padding: 4,
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/100x100?text=Logo';
                    }}
                  />
                </div>
                <div>
                  <Title level={5} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>
                    {job.company_name}
                  </Title>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                    {job.company_industry || 'Công nghệ'}
                  </div>
                </div>
              </div>

              {job.company_description && (
                <Paragraph
                  ellipsis={{ rows: 3 }}
                  style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}
                >
                  {job.company_description}
                </Paragraph>
              )}

              <Divider style={{ margin: '14px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#475569' }}>
                {job.company_size && (
                  <div>
                    <strong style={{ color: '#0f172a' }}>Quy mô:</strong> {job.company_size}
                  </div>
                )}
                {job.company_address && (
                  <div>
                    <EnvironmentOutlined style={{ color: '#2563eb', marginRight: 6 }} />
                    <strong style={{ color: '#0f172a' }}>Địa chỉ:</strong> {job.company_address}
                  </div>
                )}
                {job.company_website && (
                  <div>
                    <GlobalOutlined style={{ color: '#2563eb', marginRight: 6 }} />
                    <strong style={{ color: '#0f172a' }}>Website:</strong>{' '}
                    <a href={job.company_website} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                      {job.company_website}
                    </a>
                  </div>
                )}
                {job.company_phone && (
                  <div>
                    <PhoneOutlined style={{ color: '#2563eb', marginRight: 6 }} />
                    <strong style={{ color: '#0f172a' }}>Hotline:</strong> {job.company_phone}
                  </div>
                )}
              </div>

              {job.company_id && (
                <Button
                  block
                  style={{ marginTop: 18, borderRadius: 8, fontWeight: 600, borderColor: '#2563eb', color: '#2563eb' }}
                  onClick={() => navigate(`/companies/${job.company_id}`)}
                >
                  Xem trang công ty →
                </Button>
              )}
            </Card>

            {/* General Overview Card */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 15 }}>Thông tin chung</span>}
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 20
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Hình thức làm việc:</span>
                  <span style={{ fontWeight: 600 }}>{jobTypeLabels[job.job_type]?.text || job.job_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ngành nghề:</span>
                  <span style={{ fontWeight: 600 }}>{job.category_name || 'Khác'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Số lượng tuyển:</span>
                  <span style={{ fontWeight: 600 }}>{job.quantity || 1} người</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Ngày đăng tin:</span>
                  <span style={{ fontWeight: 600 }}>
                    {job.created_at ? new Date(job.created_at).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Hạn nộp hồ sơ:</span>
                  <span style={{ fontWeight: 600, color: isExpired ? '#ef4444' : '#059669' }}>
                    {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Tuyển liên tục'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Trust badge */}
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #dbeafe',
                background: '#eff6ff'
              }}
              bodyStyle={{ padding: 18 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <SafetyCertificateOutlined style={{ fontSize: 24, color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.5 }}>
                  <strong>Xác thực bởi UTEHY:</strong> Doanh nghiệp đối tác đã ký thỏa thuận tiếp nhận sinh viên thực tập. Nhà trường cam kết hỗ trợ sinh viên trong suốt quá trình thực tập và bảo vệ quyền lợi ứng viên.
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        visible={applyModalOpen}
        job={job}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          fetchJobDetail();
        }}
      />
    </div>
  );
}
