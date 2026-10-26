import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Typography,
  Progress,
  Button,
  Space,
  Alert,
  message
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  AuditOutlined,
  CalendarOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/stats/admin');
      if (res?.data) {
        setStats(res.data);
      }
    } catch (e) {
      console.error(e);
      const errMsg = e.message || 'Không thể tải số liệu thống kê quản trị';
      setError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  const summary = stats?.summary || {};

  const recentJobsColumns = [
    {
      title: 'Tiêu đề tin',
      dataIndex: 'title',
      key: 'title',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{t}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.company_name}</div>
        </div>
      )
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'approved' ? 'green' : s === 'pending' ? 'gold' : 'default'}>
          {s === 'approved' ? 'Đã duyệt' : s === 'pending' ? 'Chờ duyệt' : s}
        </Tag>
      )
    }
  ];

  const recentAppsColumns = [
    {
      title: 'Ứng viên',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      render: (t) => <strong style={{ color: '#0f172a' }}>{t}</strong>
    },
    {
      title: 'Vị trí & Công ty',
      key: 'job',
      render: (_, r) => (
        <div>
          <div>{r.job_title}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{r.company_name}</div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'accepted' ? 'green' : s === 'interview' ? 'purple' : 'blue'}>
          {s.toUpperCase()}
        </Tag>
      )
    }
  ];

  const handleExportReport = async () => {
    if (!stats) return;
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const summaryData = [
        { 'Chỉ số thống kê': 'Tổng số sinh viên ứng viên', 'Số lượng': summary.total_candidates || 0 },
        { 'Chỉ số thống kê': 'Tổng số doanh nghiệp đối tác', 'Số lượng': summary.total_companies || 0 },
        { 'Chỉ số thống kê': 'Tổng số tin tuyển dụng', 'Số lượng': summary.total_jobs || 0 },
        { 'Chỉ số thống kê': 'Tin tuyển dụng chờ kiểm duyệt', 'Số lượng': summary.pending_jobs || 0 },
        { 'Chỉ số thống kê': 'Tổng lượt nộp hồ sơ ứng tuyển', 'Số lượng': summary.total_applications || 0 },
        { 'Chỉ số thống kê': 'Tổng buổi hẹn phỏng vấn', 'Số lượng': summary.total_interviews || 0 },
      ];
      const ws1 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws1, 'TongQuan');

      if (stats.jobsByCategory && stats.jobsByCategory.length > 0) {
        const catData = stats.jobsByCategory.map((c, i) => ({
          'STT': i + 1,
          'Lĩnh vực / Ngành nghề': c.category_name || 'Khác',
          'Số lượng việc làm': c.job_count
        }));
        const ws2 = XLSX.utils.json_to_sheet(catData);
        XLSX.utils.book_append_sheet(wb, ws2, 'ViecLamTheoNganh');
      }

      XLSX.writeFile(wb, `Bao_cao_thong_ke_UTEHY_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success('Xuất file Excel báo cáo thống kê thành công!');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      message.error('Không thể xuất báo cáo Excel, vui lòng thử lại');
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        {error && !stats && (
          <Alert
            message="Không thể tải dữ liệu thống kê quản trị"
            description={error}
            type="error"
            showIcon
            action={
              <Button type="primary" size="small" onClick={fetchStats}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 24, borderRadius: 12 }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Bảng điều khiển Quản trị hệ thống
            </Title>
            <Text type="secondary">
              Báo cáo - Thống kê và kiểm soát hoạt động tuyển dụng toàn diện
            </Text>
          </div>

          <Space wrap>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportReport}
              style={{ color: '#059669', borderColor: '#059669', fontWeight: 600, borderRadius: 8 }}
            >
              Xuất báo cáo Excel
            </Button>
            <Button
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => navigate('/admin/jobs')}
              style={{ background: '#2563eb', borderRadius: 8, fontWeight: 600 }}
            >
              Kiểm duyệt tin ({summary.pending_jobs || 0} tin chờ)
            </Button>
            <Button
              onClick={() => navigate('/admin/users')}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Quản lý tài khoản
            </Button>
          </Space>
        </div>

        {/* 6 Metric Cards */}
        <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Sinh viên"
                value={summary.total_candidates || 0}
                prefix={<UserOutlined style={{ color: '#3b82f6', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#0f172a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Doanh nghiệp"
                value={summary.total_companies || 0}
                prefix={<BankOutlined style={{ color: '#0d9488', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#0f172a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Tổng việc làm"
                value={summary.total_jobs || 0}
                prefix={<FileDoneOutlined style={{ color: '#6366f1', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#0f172a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Tin chờ duyệt"
                value={summary.pending_jobs || 0}
                prefix={<ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Lượt nộp đơn"
                value={summary.total_applications || 0}
                prefix={<AuditOutlined style={{ color: '#10b981', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#059669' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card loading={loading} style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Lịch phỏng vấn"
                value={summary.total_interviews || 0}
                prefix={<CalendarOutlined style={{ color: '#ec4899', marginRight: 6 }} />}
                valueStyle={{ fontWeight: 800, color: '#db2777' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts & Breakdown Row */}
        <Row gutter={[24, 24]} style={{ marginBottom: 28 }}>
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 800 }}>Phân bố việc làm theo Ngành nghề</span>}
              style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
              bodyStyle={{ padding: 24 }}
            >
              {stats?.jobsByCategory?.map((item, idx) => {
                const total = summary.total_jobs || 1;
                const percent = Math.round((item.job_count / total) * 100);
                return (
                  <div key={idx} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.category_name}</span>
                      <span style={{ color: '#64748b' }}>{item.job_count} tin ({percent}%)</span>
                    </div>
                    <Progress
                      percent={percent}
                      strokeColor={idx === 0 ? '#2563eb' : idx === 1 ? '#0d9488' : '#6366f1'}
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 800 }}>Tỷ lệ hồ sơ ứng tuyển theo trạng thái</span>}
              style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
              bodyStyle={{ padding: 24 }}
            >
              {stats?.appsByStatus?.map((item, idx) => {
                const total = summary.total_applications || 1;
                const percent = Math.round((item.count / total) * 100);
                const labels = {
                  submitted: 'Mới nộp (Chờ duyệt)',
                  viewed: 'Đã xem hồ sơ',
                  interview: 'Đã xếp lịch phỏng vấn',
                  accepted: 'Trúng tuyển tiếp nhận',
                  rejected: 'Từ chối'
                };
                return (
                  <div key={idx} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{labels[item.status] || item.status}</span>
                      <span style={{ color: '#64748b' }}>{item.count} hồ sơ ({percent}%)</span>
                    </div>
                    <Progress
                      percent={percent}
                      strokeColor={item.status === 'accepted' ? '#10b981' : item.status === 'interview' ? '#7c3aed' : '#3b82f6'}
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </Card>
          </Col>
        </Row>

        {/* Recent Data Tables */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 800 }}>Tin tuyển dụng đăng gần đây</span>}
              extra={<Button type="link" onClick={() => navigate('/admin/jobs')}>Xem tất cả</Button>}
              style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
            >
              <Table
                columns={recentJobsColumns}
                dataSource={stats?.recentJobs || []}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 800 }}>Đơn ứng tuyển mới nhất</span>}
              style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
            >
              <Table
                columns={recentAppsColumns}
                dataSource={stats?.recentApplications || []}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
