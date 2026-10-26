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
  Badge,
  Rate,
  List,
  Avatar,
  Form,
  Input,
  Modal
} from 'antd';
import {
  EnvironmentOutlined,
  GlobalOutlined,
  PhoneOutlined,
  BankOutlined,
  ShareAltOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  TeamOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SendOutlined,
  CompassOutlined,
  StarFilled,
  CommentOutlined
} from '@ant-design/icons';
import api from '../api/client';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCandidate, user } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reviews states
  const [reviewsData, setReviewsData] = useState({ avg_rating: 5, total_reviews: 0, reviews: [] });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      window.scrollTo(0, 0);
      fetchCompanyDetail();
      fetchReviews();
    }
  }, [id]);

  const fetchCompanyDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/${id}`);
      if (res?.data) {
        setCompany(res.data);
      }
    } catch (err) {
      console.error('Fetch company error:', err);
      message.error('Không thể tải thông tin doanh nghiệp');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/companies/${id}/reviews`);
      if (res?.data) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.error('Fetch reviews error:', err);
    }
  };

  const handleReviewSubmit = async (values) => {
    setReviewSubmitting(true);
    try {
      const res = await api.post(`/companies/${id}/reviews`, {
        rating: values.rating,
        comment: values.comment
      });
      message.success(res.message || 'Gửi đánh giá thành công!');
      setReviewModalOpen(false);
      reviewForm.resetFields();
      fetchReviews();
    } catch (err) {
      message.error(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Đã sao chép liên kết trang doanh nghiệp vào bộ nhớ tạm!');
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '100px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#64748b' }}>Đang tải thông tin doanh nghiệp...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '80px 0' }}>
        <div className="app-container" style={{ textAlign: 'center' }}>
          <Empty description="Không tìm thấy doanh nghiệp này hoặc đã bị xóa." />
          <Button type="primary" onClick={() => navigate('/companies')} style={{ marginTop: 20 }}>
            Quay lại danh sách doanh nghiệp
          </Button>
        </div>
      </div>
    );
  }

  const jobs = company.jobs || [];

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '24px 0 60px' }}>
      <div className="app-container">
        {/* Breadcrumb & Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Breadcrumb
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/companies">Doanh nghiệp</Link> },
              { title: <span style={{ color: '#0f172a', fontWeight: 600 }}>{company.name}</span> }
            ]}
          />
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/companies')}
            style={{ fontWeight: 600, color: '#2563eb' }}
          >
            Quay lại danh sách doanh nghiệp
          </Button>
        </div>

        {/* Company Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)',
            borderRadius: 20,
            padding: '36px 32px 32px',
            color: '#ffffff',
            marginBottom: 24,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle background decoration */}
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 18,
                background: '#ffffff',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                padding: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              <img
                src={company.logo_url}
                alt={company.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/120x120?text=Company';
                }}
              />
            </div>

            {/* Title & Info */}
            <div style={{ flex: '1 1 360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Title level={1} style={{ margin: 0, color: '#ffffff', fontSize: 28, fontWeight: 800 }}>
                  {company.name}
                </Title>
                <Tag color="success" style={{ borderRadius: 6, fontWeight: 700, padding: '2px 8px' }}>
                  <CheckCircleFilled style={{ marginRight: 4 }} /> Đối tác UTEHY
                </Tag>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, alignItems: 'center', fontSize: 14, color: '#e2e8f0' }}>
                {company.industry && (
                  <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600, padding: '2px 8px' }}>
                    <AppstoreOutlined style={{ marginRight: 4 }} />
                    {company.industry}
                  </Tag>
                )}
                {company.size && (
                  <span>
                    <TeamOutlined style={{ marginRight: 6 }} /> Quy mô: {company.size}
                  </span>
                )}
                {company.address && (
                  <span>
                    <EnvironmentOutlined style={{ marginRight: 6 }} />
                    {company.address.split(',').pop() || company.address}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {company.website && (
                <Button
                  type="primary"
                  ghost
                  icon={<GlobalOutlined />}
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 10,
                    fontWeight: 600,
                    height: 42
                  }}
                >
                  Truy cập Website
                </Button>
              )}
              {company.phone && (
                <Button
                  ghost
                  icon={<PhoneOutlined />}
                  href={`tel:${company.phone}`}
                  style={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 10,
                    fontWeight: 600,
                    height: 42
                  }}
                >
                  Hotline
                </Button>
              )}
              <Tooltip title="Chia sẻ trang doanh nghiệp">
                <Button
                  ghost
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  style={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 10,
                    height: 42
                  }}
                />
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center' }} bodyStyle={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Vị trí đang tuyển dụng</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                {jobs.length}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center' }} bodyStyle={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Lĩnh vực chuyên môn</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company.industry || 'Công nghệ thông tin'}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center' }} bodyStyle={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Quy mô nhân sự</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>
                {company.size || '50 - 200 nhân viên'}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0', textAlign: 'center' }} bodyStyle={{ padding: 18 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Thỏa thuận hợp tác</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginTop: 8 }}>
                Đã ký kết UTEHY
              </div>
            </Card>
          </Col>
        </Row>

        {/* Main Content Layout */}
        <Row gutter={[24, 24]}>
          {/* Left Column: About & Jobs */}
          <Col xs={24} lg={16}>
            {/* About Section */}
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              bodyStyle={{ padding: 28 }}
            >
              <Title level={4} style={{ color: '#0f172a', borderLeft: '4px solid #2563eb', paddingLeft: 12, marginBottom: 16 }}>
                Giới thiệu về doanh nghiệp
              </Title>
              <div style={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.85, fontSize: 15 }}>
                {company.description || 'Doanh nghiệp đối tác tuyển dụng của Trường Đại học Sư phạm Kỹ thuật Hưng Yên.'}
              </div>
            </Card>

            {/* Active Recruitment Jobs */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  Vị trí đang tuyển dụng ({jobs.length})
                </Title>
                <Text type="secondary">Cơ hội thực tập & làm việc tại {company.name}</Text>
              </div>

              {jobs.length === 0 ? (
                <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0', border: '1px solid #e2e8f0' }}>
                  <Empty description="Hiện doanh nghiệp chưa có vị trí tuyển dụng mới nào đang mở." />
                  <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 16 }}>
                    Xem việc làm từ doanh nghiệp khác
                  </Button>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={{
                        ...job,
                        company_name: company.name,
                        company_logo: company.logo_url
                      }}
                      onSelect={(targetJob) => navigate(`/jobs/${targetJob.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Student Reviews & Ratings */}
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginTop: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
                    ⭐ Đánh giá từ Thực tập sinh ({reviewsData.total_reviews})
                  </Title>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Rate disabled allowHalf value={reviewsData.avg_rating} style={{ fontSize: 16 }} />
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{reviewsData.avg_rating} / 5.0</span>
                  </div>
                </div>

                {isCandidate && (
                  <Button
                    type="primary"
                    icon={<CommentOutlined />}
                    onClick={() => {
                      reviewForm.resetFields();
                      setReviewModalOpen(true);
                    }}
                    style={{ background: '#2563eb', borderRadius: 8, fontWeight: 600 }}
                  >
                    Viết đánh giá
                  </Button>
                )}
              </div>

              <Divider style={{ margin: '14px 0' }} />

              {reviewsData.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  Chưa có nhận xét nào từ sinh viên. Hãy là người đầu tiên chia sẻ cảm nhận thực tập tại {company.name}!
                </div>
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={reviewsData.reviews}
                  renderItem={(rev) => (
                    <List.Item style={{ padding: '14px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            src={rev.candidate_avatar}
                            style={{ backgroundColor: '#2563eb', fontWeight: 700 }}
                          >
                            {rev.candidate_name ? rev.candidate_name.charAt(0).toUpperCase() : 'S'}
                          </Avatar>
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ fontWeight: 700, color: '#0f172a', marginRight: 8 }}>{rev.candidate_name}</span>
                              <Tag color="cyan" style={{ borderRadius: 4, fontSize: 11 }}>{rev.university || 'UTEHY'}</Tag>
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>
                              {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        }
                        description={
                          <div style={{ marginTop: 4 }}>
                            <Rate disabled value={rev.rating} style={{ fontSize: 13, marginBottom: 6 }} />
                            <div style={{ color: '#334155', fontSize: 14, lineHeight: 1.6 }}>{rev.comment}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          {/* Right Column: Contact Details & Partnership Notes */}
          <Col xs={24} lg={8}>
            {/* Contact Card */}
            <Card
              title={<span style={{ fontWeight: 700, fontSize: 15 }}>Thông tin liên hệ</span>}
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
              bodyStyle={{ padding: 22 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                {company.address && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Trụ sở chính:</div>
                    <div style={{ color: '#0f172a', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <EnvironmentOutlined style={{ color: '#2563eb', marginTop: 3, flexShrink: 0 }} />
                      <span>{company.address}</span>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Website chính thức:</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <GlobalOutlined style={{ color: '#2563eb', flexShrink: 0 }} />
                      <a href={company.website} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                        {company.website}
                      </a>
                    </div>
                  </div>
                )}

                {company.phone && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Hotline liên hệ:</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <PhoneOutlined style={{ color: '#2563eb', flexShrink: 0 }} />
                      <a href={`tel:${company.phone}`} style={{ color: '#0f172a', fontWeight: 600 }}>
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}

                {company.industry && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Lĩnh vực hoạt động:</div>
                    <div style={{ color: '#0f172a', fontWeight: 600 }}>{company.industry}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* UTEHY Partnership Info */}
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #dbeafe',
                background: '#eff6ff',
                marginBottom: 20
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <SafetyCertificateOutlined style={{ fontSize: 26, color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: 15, marginBottom: 6 }}>
                    Thỏa thuận hợp tác Khoa CNTT
                  </div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                    {company.name} là đơn vị thường niên tiếp nhận sinh viên Đại học Sư phạm Kỹ thuật Hưng Yên tham gia kỳ thực tập doanh nghiệp.
                    Sinh viên được cử chuyên gia kèm cặp, đánh giá phiếu nhận xét thực tập và ưu tiên tuyển dụng chính thức.
                  </div>
                </div>
              </div>
            </Card>

            {/* Other Companies Button */}
            <Button
              block
              size="large"
              style={{ borderRadius: 10, fontWeight: 600 }}
              onClick={() => navigate('/companies')}
            >
              Khám phá thêm các công ty khác →
            </Button>
          </Col>
        </Row>
      </div>

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StarFilled style={{ color: '#f59e0b' }} />
            <span>Đánh giá kỳ thực tập tại {company?.name}</span>
          </div>
        }
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={reviewForm}
          layout="vertical"
          initialValues={{ rating: 5 }}
          onFinish={handleReviewSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="rating"
            label="Mức độ hài lòng của bạn"
            rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
          >
            <Rate style={{ fontSize: 24 }} />
          </Form.Item>

          <Form.Item
            name="comment"
            label="Cảm nhận & Đánh giá chi tiết"
            rules={[
              { required: true, message: 'Vui lòng nhập nhận xét' },
              { min: 5, message: 'Nhận xét phải có ít nhất 5 ký tự' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Chia sẻ về môi trường làm việc, sự nhiệt tình hỗ trợ của mentor/đồng nghiệp, dự án được tham gia, chế độ phụ cấp..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setReviewModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={reviewSubmitting}
              style={{ background: '#2563eb' }}
            >
              Gửi đánh giá
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
