import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Input,
  Select,
  Card,
  Radio,
  Slider,
  Pagination,
  Spin,
  Empty,
  Typography,
  Button,
  Tag,
  Space
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  DollarOutlined
} from '@ant-design/icons';
import api from '../api/client';
import JobCard from '../components/JobCard';

const { Title, Text } = Typography;
const { Option } = Select;

export default function JobsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') || '');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [keyword, categoryId, location, jobType, salaryFilter, page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res?.data) setCategories(res.data);
    } catch (e) {}
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (categoryId) params.append('category_id', categoryId);
      if (location) params.append('location', location);
      if (jobType) params.append('job_type', jobType);

      if (salaryFilter === 'under_5m') {
        params.append('max_salary', 5000000);
      } else if (salaryFilter === '5m_10m') {
        params.append('min_salary', 5000000);
        params.append('max_salary', 10000000);
      } else if (salaryFilter === 'above_10m') {
        params.append('min_salary', 10000000);
      }

      params.append('page', page);
      params.append('limit', 8);

      const res = await api.get(`/jobs?${params.toString()}`);
      if (res?.data) {
        setJobs(res.data.jobs);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setCategoryId('');
    setLocation('');
    setJobType('');
    setSalaryFilter('');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        {/* Header Breadcrumb / Title */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Tìm kiếm việc làm & thực tập sinh
          </Title>
          <Text type="secondary">
            Tìm thấy <strong>{total}</strong> vị trí tuyển dụng phù hợp với tiêu chí của bạn
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Left Filter Sidebar */}
          <Col xs={24} md={8} lg={7}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                position: 'sticky',
                top: 80
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 16 }}>
                  <FilterOutlined style={{ color: '#2563eb' }} /> Bộ lọc tìm kiếm
                </div>
                <Button type="link" size="small" onClick={handleResetFilters} style={{ padding: 0 }}>
                  Đặt lại
                </Button>
              </div>

              {/* Keyword */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Từ khóa tìm kiếm</div>
                <Input
                  prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Tiêu đề, kỹ năng..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Ngành nghề</div>
                <Select
                  placeholder="Tất cả ngành nghề"
                  value={categoryId || undefined}
                  onChange={setCategoryId}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* Location */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Địa điểm</div>
                <Select
                  placeholder="Tất cả địa điểm"
                  value={location || undefined}
                  onChange={setLocation}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="Hà Nội">Hà Nội</Option>
                  <Option value="Hưng Yên">Hưng Yên</Option>
                  <Option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</Option>
                  <Option value="Đà Nẵng">Đà Nẵng</Option>
                </Select>
              </div>

              {/* Job Type */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Hình thức làm việc</div>
                <Radio.Group
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <Radio value="">Tất cả hình thức</Radio>
                  <Radio value="internship">Thực tập sinh (Internship)</Radio>
                  <Radio value="full_time">Toàn thời gian (Full-time)</Radio>
                  <Radio value="part_time">Bán thời gian (Part-time)</Radio>
                </Radio.Group>
              </div>

              {/* Salary range */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Mức lương / Trợ cấp</div>
                <Radio.Group
                  value={salaryFilter}
                  onChange={(e) => setSalaryFilter(e.target.value)}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <Radio value="">Tất cả mức lương</Radio>
                  <Radio value="under_5m">Dưới 5 triệu</Radio>
                  <Radio value="5m_10m">Từ 5 - 10 triệu</Radio>
                  <Radio value="above_10m">Trên 10 triệu</Radio>
                </Radio.Group>
              </div>
            </Card>
          </Col>

          {/* Right Job List */}
          <Col xs={24} md={16} lg={17}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Spin size="large" />
              </div>
            ) : jobs.length === 0 ? (
              <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
                <Empty description="Không tìm thấy việc làm nào khớp với bộ lọc." />
                <Button type="primary" onClick={handleResetFilters} style={{ marginTop: 16 }}>
                  Xóa bộ lọc và thử lại
                </Button>
              </Card>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSelect={(j) => navigate(`/jobs/${j.id}`)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={8}
                    onChange={(p) => setPage(p)}
                    showSizeChanger={false}
                  />
                </div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
