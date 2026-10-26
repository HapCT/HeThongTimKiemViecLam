import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Input,
  Tag,
  Typography,
  Spin,
  Button,
  Empty,
  message
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  BankOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  TeamOutlined
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Paragraph, Text } = Typography;

export default function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, [keyword]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies?keyword=${encodeURIComponent(keyword)}`);
      if (res?.data) setCompanies(res.data);
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Không thể tải danh sách doanh nghiệp, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Doanh nghiệp đối tác tuyển dụng
            </Title>
            <Text type="secondary">
              Khám phá các tổ chức, tập đoàn công nghệ kết nối cùng sinh viên UTEHY
            </Text>
          </div>

          <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo tên công ty..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 280, borderRadius: 8 }}
            allowClear
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : companies.length === 0 ? (
          <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
            <Empty description="Không tìm thấy doanh nghiệp nào phù hợp." />
            <Button type="primary" onClick={() => setKeyword('')} style={{ marginTop: 16 }}>
              Xem tất cả doanh nghiệp
            </Button>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {companies.map((comp) => (
              <Col xs={24} md={12} lg={8} key={comp.id}>
                <Card
                  hoverable
                  className="hover-lift"
                  onClick={() => navigate(`/companies/${comp.id}`)}
                  style={{
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    height: '100%',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        padding: 4,
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={comp.logo_url}
                        alt={comp.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/100x100?text=Logo';
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: 16,
                          color: '#0f172a',
                          fontWeight: 700,
                          lineHeight: 1.3
                        }}
                      >
                        {comp.name}
                      </Title>
                      <Tag color="cyan" style={{ borderRadius: 4, marginTop: 6, fontSize: 11 }}>
                        {comp.industry || 'Công nghệ'}
                      </Tag>
                    </div>
                  </div>

                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ color: '#64748b', fontSize: 13, flex: 1, marginBottom: 14 }}
                  >
                    {comp.description || 'Chưa có mô tả chi tiết.'}
                  </Paragraph>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {comp.address ? comp.address.split(',').pop() : 'Toàn quốc'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                        {comp.active_jobs_count || 1} việc làm
                      </Tag>
                      <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
                        Chi tiết <ArrowRightOutlined style={{ fontSize: 11 }} />
                      </span>
                    </div>
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
