import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Typography,
  Card,
  Spin,
  Space,
  Tag
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  ThunderboltFilled,
  RightOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  BankOutlined,
  RiseOutlined
} from '@ant-design/icons';
import api from '../api/client';
import JobCard from '../components/JobCard';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

export default function HomePage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, jobsRes, compsRes, statsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/jobs?limit=6'),
        api.get('/companies'),
        api.get('/stats/public')
      ]);

      if (catsRes?.data) setCategories(catsRes.data);
      if (jobsRes?.data?.jobs) setFeaturedJobs(jobsRes.data.jobs);
      if (compsRes?.data) setCompanies(compsRes.data);
      if (statsRes?.data) setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (categoryId) params.append('category_id', categoryId);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient" style={{ padding: '64px 0 72px' }}>
        <div className="app-container">
          <div style={{ maxWidth: 940, margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                padding: '6px 18px',
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 600,
                color: '#93c5fd',
                marginBottom: 20
              }}
            >
              Cổng kết nối việc làm sinh viên UTEHY
            </div>

            <Title
              level={1}
              style={{
                color: '#ffffff',
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: 18,
                letterSpacing: -0.5
              }}
            >
              Khởi đầu sự nghiệp với hàng trăm vị trí{' '}
              <span style={{ color: '#60a5fa' }}>Thực tập & Việc làm</span> chất lượng cao
            </Title>

            <Paragraph
              style={{
                color: '#cbd5e1',
                fontSize: 16,
                lineHeight: 1.7,
                maxWidth: 680,
                margin: '0 auto 36px'
              }}
            >
              Nền tảng hỗ trợ sinh viên UTEHY xây dựng CV trực tuyến, tiếp cận các doanh nghiệp đối tác uy tín và theo dõi tiến trình tuyển dụng thời gian thực.
            </Paragraph>

            {/* Instant Search Bar Box */}
            <div
              style={{
                background: '#ffffff',
                padding: 12,
                borderRadius: 16,
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                textAlign: 'left'
              }}
            >
              <Input
                prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: 16 }} />}
                placeholder="Vị trí, kỹ năng (Node.js, React, Marketing...)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={handleSearch}
                style={{ flex: '1 1 240px', border: 'none', background: '#f8fafc', height: 48, borderRadius: 10, fontSize: 14 }}
              />

              <Select
                placeholder="Địa điểm"
                value={location || undefined}
                onChange={setLocation}
                allowClear
                style={{ flex: '1 1 140px', height: 48 }}
              >
                <Option value="Hà Nội">Hà Nội</Option>
                <Option value="Hưng Yên">Hưng Yên</Option>
                <Option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</Option>
                <Option value="Đà Nẵng">Đà Nẵng</Option>
              </Select>

              <Select
                placeholder="Ngành nghề"
                value={categoryId || undefined}
                onChange={setCategoryId}
                allowClear
                style={{ flex: '1 1 160px', height: 48 }}
              >
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ height: 48, padding: '0 32px', borderRadius: 10, fontWeight: 700, fontSize: 15, background: '#2563eb' }}
              >
                Tìm việc
              </Button>
            </div>

            {/* Quick tags */}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13, color: '#93c5fd' }}>
              <span style={{ fontWeight: 600 }}>Từ khóa phổ biến:</span>
              {['Thực tập Node.js', 'ReactJS', 'React Native', 'Data Analyst', 'Marketing', 'UI/UX'].map((kw) => (
                <span
                  key={kw}
                  onClick={() => {
                    setKeyword(kw);
                    navigate(`/jobs?keyword=${encodeURIComponent(kw)}`);
                  }}
                  style={{
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '3px 12px',
                    borderRadius: 14,
                    color: '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>

            {/* Verification trust note */}
            <div
              style={{
                marginTop: 26,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                background: 'rgba(37, 99, 235, 0.25)',
                borderRadius: 20,
                border: '1px solid rgba(96, 165, 250, 0.35)',
                fontSize: 13,
                color: '#e2e8f0'
              }}
            >
              <span>Các tin tuyển dụng được kiểm duyệt trực tiếp bởi Nhà trường & Khoa CNTT UTEHY</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Categories Section */}
      <section style={{ padding: '48px 0', background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="app-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
            <div>
              <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                Ngành nghề tuyển dụng nổi bật
              </Title>
              <Text type="secondary">Tìm kiếm cơ hội theo lĩnh vực học tập của bạn</Text>
            </div>
            <Button type="link" onClick={() => navigate('/jobs')} style={{ fontWeight: 600 }}>
              Xem tất cả ngành nghề →
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            {categories.map((cat) => (
              <Col xs={12} sm={8} md={6} lg={3} key={cat.id}>
                <Card
                  hoverable
                  className="hover-lift"
                  onClick={() => navigate(`/jobs?category_id=${cat.id}`)}
                  style={{
                    borderRadius: 14,
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: '18px 10px' }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      margin: '0 auto 10px'
                    }}
                  >
                    <AppstoreOutlined />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>
                    {cat.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {cat.job_count || 0} việc làm
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Latest Internship Jobs Section */}
      <section style={{ padding: '56px 0', background: '#f8fafc' }}>
        <div className="app-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                TIN TUYỂN DỤNG MỚI NHẤT
              </div>
              <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                Cơ hội thực tập & việc làm đang mở đơn
              </Title>
            </div>
            <Button
              type="primary"
              onClick={() => navigate('/jobs')}
              style={{ borderRadius: 8, background: '#2563eb', fontWeight: 600 }}
            >
              Xem tất cả ({featuredJobs.length}+) việc làm
            </Button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Row gutter={[20, 20]}>
              {featuredJobs.map((job) => (
                <Col xs={24} lg={12} key={job.id}>
                  <JobCard job={job} onSelect={(j) => navigate(`/jobs/${j.id}`)} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </section>

      {/* Top Companies Section */}
      <section style={{ padding: '56px 0', background: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Doanh nghiệp công nghệ hàng đầu hợp tác cùng UTEHY
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: 15, marginTop: 6 }}>
              Tiếp nhận sinh viên thực tập chuyên ngành Kỹ thuật phần mềm & CNTT hàng năm
            </Paragraph>
          </div>

          <Row gutter={[20, 20]}>
            {companies.map((comp) => (
              <Col xs={24} sm={12} md={8} lg={4.8} key={comp.id}>
                <Card
                  hoverable
                  className="hover-lift"
                  onClick={() => navigate(`/companies/${comp.id}`)}
                  style={{
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      border: '1px solid #f1f5f9',
                      margin: '0 auto 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: 6
                    }}
                  >
                    <img
                      src={comp.logo_url}
                      alt={comp.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100?text=Company';
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#0f172a',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {comp.name}
                  </div>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                    {comp.active_jobs_count || 1} việc làm đang tuyển
                  </Tag>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>
    </div>
  );
}
