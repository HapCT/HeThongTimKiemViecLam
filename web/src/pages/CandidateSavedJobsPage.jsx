import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Empty, Button } from 'antd';
import { HeartFilled } from '@ant-design/icons';
import api from '../api/client';
import JobCard from '../components/JobCard';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function CandidateSavedJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/saved-jobs');
      if (res?.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 14 }}>
            <HeartFilled /> VIỆC LÀM ĐÃ LƯU
          </div>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Danh sách việc làm yêu thích
          </Title>
          <Text type="secondary">
            Xem lại các tin tuyển dụng bạn đã đánh dấu quan tâm
          </Text>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Spin size="large" />
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', background: '#ffffff', padding: '60px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <Empty description="Bạn chưa lưu tin tuyển dụng nào." />
            <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 16 }}>
              Khám phá việc làm ngay
            </Button>
          </div>
        ) : (
          <Row gutter={[20, 20]}>
            {jobs.map((job) => (
              <Col xs={24} lg={12} key={job.id}>
                <JobCard job={job} onSelect={(j) => navigate(`/jobs/${j.id}`)} />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
