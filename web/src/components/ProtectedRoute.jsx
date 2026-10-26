import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Tag, Space } from 'antd';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    );
  }

  // Not logged in -> Redirect to /login
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    const roleLabels = {
      candidate: 'Sinh viên',
      company: 'Doanh nghiệp',
      admin: 'Quản trị viên'
    };

    const currentLabel = roleLabels[user?.role] || user?.role;
    const requiredLabels = allowedRoles.map(r => roleLabels[r] || r).join(' hoặc ');

    return (
      <div style={{ padding: '60px 20px', maxWidth: 700, margin: '0 auto' }}>
        <Result
          status="403"
          title="Từ chối truy cập (Phân quyền)"
          subTitle={
            <div>
              <p style={{ fontSize: 16, color: '#475569' }}>
                Trang này yêu cầu quyền <b>{requiredLabels}</b>.
              </p>
              <p style={{ color: '#64748b' }}>
                Tài khoản của bạn đang đăng nhập với vai trò:{' '}
                <Tag color="orange" style={{ fontWeight: 700 }}>{currentLabel}</Tag>
              </p>
            </div>
          }
          extra={
            <Space size="middle" wrap>
              {user?.role === 'company' && (
                <Button type="primary" onClick={() => navigate('/company/dashboard')}>
                  Đến Bảng Điều Khiển Doanh Nghiệp
                </Button>
              )}
              {user?.role === 'admin' && (
                <Button type="primary" onClick={() => navigate('/admin/dashboard')}>
                  Đến Bảng Điều Khiển Quản Trị
                </Button>
              )}
              {user?.role === 'candidate' && (
                <Button type="primary" onClick={() => navigate('/jobs')}>
                  Tìm Kiếm Việc Làm
                </Button>
              )}
              <Button onClick={() => navigate('/')}>
                Về Trang chủ
              </Button>
              <Button danger onClick={logout}>
                Đăng xuất
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return children;
}
