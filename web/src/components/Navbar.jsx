import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  Badge,
  Dropdown,
  Avatar,
  Button,
  Popover,
  List,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Drawer
} from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  FileTextOutlined,
  CalendarOutlined,
  HeartOutlined,
  DashboardOutlined,
  TeamOutlined,
  AuditOutlined,
  AppstoreOutlined,
  KeyOutlined,
  LockOutlined,
  MenuOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function Navbar() {
  const { user, logout, isCandidate, isCompany, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.role === 'candidate') {
      return user.candidate_name || user.full_name || 'Sinh viên';
    }
    if (user.role === 'company') {
      return user.company_name || user.name || 'Doanh nghiệp';
    }
    if (user.role === 'admin') {
      return 'Quản trị viên';
    }
    return user.email || 'Người dùng';
  };

  // Change Password Modal
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdForm] = Form.useForm();

  const handleChangePassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không trùng khớp');
      return;
    }
    setChangingPwd(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success(res.message || 'Đổi mật khẩu thành công!');
      setChangePasswordOpen(false);
      pwdForm.resetFields();
    } catch (err) {
      message.error(err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setChangingPwd(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res?.data) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      }
    } catch (e) {
      console.warn('Lỗi khi tải thông báo hệ thống:', e.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch {}
  };

  const notificationContent = (
    <div style={{ width: 340, maxHeight: 420, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
        <Text strong>Thông báo ({unreadCount})</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead} style={{ padding: 0 }}>
            Đánh dấu đã đọc
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        locale={{ emptyText: 'Chưa có thông báo nào' }}
        renderItem={(item) => (
          <List.Item
            onClick={() => markNotificationRead(item.id)}
            style={{
              cursor: 'pointer',
              padding: '10px 8px',
              borderRadius: 8,
              background: item.is_read ? 'transparent' : '#f0f9ff',
              marginBottom: 4
            }}
          >
            <List.Item.Meta
              avatar={<Avatar icon={<BellOutlined />} style={{ background: item.is_read ? '#cbd5e1' : '#3b82f6' }} />}
              title={<span style={{ fontSize: 13, fontWeight: item.is_read ? 500 : 700 }}>{item.title}</span>}
              description={<span style={{ fontSize: 12, color: '#64748b' }}>{item.body}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700 }}>
            {getUserDisplayName()}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{user?.email}</div>
        </div>
      ),
      disabled: true
    },
    { type: 'divider' },
    ...(isCandidate
      ? [
          {
            key: 'cand_profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
            onClick: () => navigate('/candidate/profile')
          },
          {
            key: 'cand_cv',
            icon: <FileTextOutlined />,
            label: 'Quản lý CV',
            onClick: () => navigate('/candidate/cvs')
          },
          {
            key: 'cand_apps',
            icon: <CheckCircleOutlined />,
            label: 'Việc làm đã nộp',
            onClick: () => navigate('/candidate/applications')
          },
          {
            key: 'cand_saved',
            icon: <HeartOutlined style={{ color: '#ef4444' }} />,
            label: 'Việc làm đã lưu',
            onClick: () => navigate('/candidate/saved')
          },
          {
            key: 'cand_interviews',
            icon: <CalendarOutlined />,
            label: 'Lịch phỏng vấn',
            onClick: () => navigate('/candidate/interviews')
          }
        ]
      : []),
    ...(isCompany
      ? [
          {
            key: 'comp_dashboard',
            icon: <DashboardOutlined />,
            label: 'Bảng tin tuyển dụng',
            onClick: () => navigate('/company/dashboard')
          },
          {
            key: 'comp_applicants',
            icon: <TeamOutlined />,
            label: 'Danh sách ứng viên',
            onClick: () => navigate('/company/applicants')
          },
          {
            key: 'comp_interviews',
            icon: <CalendarOutlined />,
            label: 'Lịch phỏng vấn',
            onClick: () => navigate('/company/interviews')
          }
        ]
      : []),
    ...(isAdmin
      ? [
          {
            key: 'admin_dashboard',
            icon: <DashboardOutlined />,
            label: 'Bảng điều khiển quản trị',
            onClick: () => navigate('/admin/dashboard')
          },
          {
            key: 'admin_review',
            icon: <AuditOutlined />,
            label: 'Kiểm duyệt tin tuyển dụng',
            onClick: () => navigate('/admin/jobs')
          },
          {
            key: 'admin_cats',
            icon: <AppstoreOutlined />,
            label: 'Quản lý ngành nghề',
            onClick: () => navigate('/admin/categories')
          },
          {
            key: 'admin_users',
            icon: <TeamOutlined />,
            label: 'Quản lý người dùng',
            onClick: () => navigate('/admin/users')
          }
        ]
      : []),
    { type: 'divider' },
    {
      key: 'change_password',
      icon: <KeyOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => {
        pwdForm.resetFields();
        setChangePasswordOpen(true);
      }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: logout
    }
  ];

  return (
    <header className="site-header">
      <div className="header-container">
        {/* Logo Brand - Clean typography without icon */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, textDecoration: 'none' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.6, lineHeight: 1 }}>
            Job<span style={{ color: '#2563eb' }}>UTEHY</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#1d4ed8',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '3px 9px',
              borderRadius: 20,
              letterSpacing: 0.2,
              lineHeight: 1
            }}
          >
            Việc Làm & Thực Tập
          </span>
        </Link>

        {/* Navigation Links with pill style and NO line wrapping */}
        <nav className="nav-links-scroll desktop-only">
          <Link to="/" className={`nav-link-item ${location.pathname === '/' ? 'active' : ''}`}>
            Trang chủ
          </Link>
          <Link to="/jobs" className={`nav-link-item ${location.pathname.startsWith('/jobs') ? 'active' : ''}`}>
            Việc làm
          </Link>
          <Link to="/companies" className={`nav-link-item ${location.pathname.startsWith('/companies') ? 'active' : ''}`}>
            Doanh nghiệp
          </Link>

          {/* Candidate-specific quick links */}
          {isCandidate && (
            <>
              <Link to="/candidate/cvs" className={`nav-link-item ${location.pathname === '/candidate/cvs' ? 'active' : ''}`}>
                CV của tôi
              </Link>
              <Link to="/candidate/applications" className={`nav-link-item ${location.pathname === '/candidate/applications' ? 'active' : ''}`}>
                Đã ứng tuyển
              </Link>
              <Link to="/candidate/saved" className={`nav-link-item ${location.pathname === '/candidate/saved' ? 'active' : ''}`}>
                Đã lưu
              </Link>
              <Link to="/candidate/interviews" className={`nav-link-item ${location.pathname === '/candidate/interviews' ? 'active' : ''}`}>
                Lịch phỏng vấn
              </Link>
            </>
          )}

          {/* Company-specific quick links */}
          {isCompany && (
            <>
              <Link to="/company/dashboard" className={`nav-link-item ${location.pathname === '/company/dashboard' ? 'active' : ''}`}>
                Bảng tin
              </Link>
              <Link to="/company/applicants" className={`nav-link-item ${location.pathname === '/company/applicants' ? 'active' : ''}`}>
                Ứng viên
              </Link>
              <Link to="/company/interviews" className={`nav-link-item ${location.pathname === '/company/interviews' ? 'active' : ''}`}>
                Lịch phỏng vấn
              </Link>
            </>
          )}

          {/* Admin-specific quick links */}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className={`nav-link-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
                Thống kê
              </Link>
              <Link to="/admin/jobs" className={`nav-link-item ${location.pathname === '/admin/jobs' ? 'active' : ''}`}>
                Duyệt tin
              </Link>
              <Link to="/admin/categories" className={`nav-link-item ${location.pathname === '/admin/categories' ? 'active' : ''}`}>
                Ngành nghề
              </Link>
              <Link to="/admin/users" className={`nav-link-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                Tài khoản
              </Link>
            </>
          )}
        </nav>

        {/* Right Action Icons & Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {user ? (
            <>
              {isCompany && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/company/dashboard?action=new')}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    background: '#2563eb',
                    whiteSpace: 'nowrap',
                    height: 36,
                    padding: '0 14px'
                  }}
                >
                  Đăng tin
                </Button>
              )}

              {/* Notifications Popover */}
              <Popover content={notificationContent} trigger="click" placement="bottomRight">
                <Badge count={unreadCount} overflowCount={9} offset={[-2, 4]}>
                  <Button
                    shape="circle"
                    icon={<BellOutlined style={{ fontSize: 16, color: '#475569' }} />}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </Badge>
              </Popover>

              {/* Current user badge & dropdown */}
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <div className="user-card-pill">
                  <Avatar
                    size={28}
                    src={user?.avatar_url || user?.logo_url}
                    icon={<UserOutlined />}
                    style={{
                      background:
                        user?.role === 'admin'
                          ? '#ef4444'
                          : user?.role === 'company'
                          ? '#0d9488'
                          : '#2563eb',
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      maxWidth: 130,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }}
                  >
                    {getUserDisplayName()}
                  </span>
                  <Tag
                    color={user?.role === 'admin' ? 'red' : user?.role === 'company' ? 'cyan' : 'blue'}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: '18px',
                      margin: 0,
                      padding: '0 6px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.role === 'candidate'
                      ? 'SINH VIÊN'
                      : user?.role === 'company'
                      ? 'DOANH NGHIỆP'
                      : 'QUẢN TRỊ'}
                  </Tag>
                </div>
              </Dropdown>

              {/* Standalone Logout Button */}
              <button
                type="button"
                className="btn-logout-header"
                onClick={logout}
                title="Đăng xuất khỏi hệ thống"
              >
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <Link to="/login">
                <Button
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 36,
                    padding: '0 16px',
                    borderColor: '#cbd5e1',
                    color: '#1e293b'
                  }}
                >
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  type="primary"
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    height: 36,
                    padding: '0 16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}

          {/* Hamburger Menu for Mobile */}
          <Button
            className="mobile-only"
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20, color: '#334155' }} />}
            onClick={() => setDrawerOpen(true)}
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e2e8f0',
              borderRadius: 8
            }}
          />
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              Job<span style={{ color: '#2563eb' }}>UTEHY</span>
            </span>
          </div>
        }
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {user && (
            <div style={{ paddingBottom: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar
                size={44}
                src={user?.avatar_url || user?.logo_url}
                icon={<UserOutlined />}
                style={{
                  background:
                    user?.role === 'admin'
                      ? '#ef4444'
                      : user?.role === 'company'
                      ? '#0d9488'
                      : '#2563eb'
                }}
              />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {getUserDisplayName()}
                </div>
                <Tag color={user?.role === 'admin' ? 'red' : user?.role === 'company' ? 'cyan' : 'blue'} style={{ marginTop: 4, borderRadius: 4 }}>
                  {user?.role === 'candidate' ? 'SINH VIÊN' : user?.role === 'company' ? 'DOANH NGHIỆP' : 'QUẢN TRỊ'}
                </Tag>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link to="/" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/' ? 'active' : ''}`}>
              Trang chủ
            </Link>
            <Link to="/jobs" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname.startsWith('/jobs') ? 'active' : ''}`}>
              Việc làm
            </Link>
            <Link to="/companies" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname.startsWith('/companies') ? 'active' : ''}`}>
              Doanh nghiệp
            </Link>

            {isCandidate && (
              <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }} />
                <Link to="/candidate/profile" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/candidate/profile' ? 'active' : ''}`}>
                  Hồ sơ cá nhân
                </Link>
                <Link to="/candidate/cvs" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/candidate/cvs' ? 'active' : ''}`}>
                  CV của tôi
                </Link>
                <Link to="/candidate/applications" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/candidate/applications' ? 'active' : ''}`}>
                  Việc đã ứng tuyển
                </Link>
                <Link to="/candidate/saved" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/candidate/saved' ? 'active' : ''}`}>
                  Việc làm đã lưu
                </Link>
                <Link to="/candidate/interviews" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/candidate/interviews' ? 'active' : ''}`}>
                  Lịch phỏng vấn
                </Link>
              </>
            )}

            {isCompany && (
              <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }} />
                <Link to="/company/dashboard" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/company/dashboard' ? 'active' : ''}`}>
                  Bảng điều khiển
                </Link>
                <Link to="/company/applicants" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/company/applicants' ? 'active' : ''}`}>
                  Quản lý ứng viên
                </Link>
                <Link to="/company/interviews" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/company/interviews' ? 'active' : ''}`}>
                  Lịch phỏng vấn
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <div style={{ height: 1, background: '#f1f5f9', margin: '8px 0' }} />
                <Link to="/admin/dashboard" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
                  Thống kê hệ thống
                </Link>
                <Link to="/admin/jobs" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/admin/jobs' ? 'active' : ''}`}>
                  Kiểm duyệt tin
                </Link>
                <Link to="/admin/categories" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/admin/categories' ? 'active' : ''}`}>
                  Quản lý ngành nghề
                </Link>
                <Link to="/admin/users" onClick={() => setDrawerOpen(false)} className={`nav-link-item ${location.pathname === '/admin/users' ? 'active' : ''}`}>
                  Quản lý người dùng
                </Link>
              </>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user ? (
              <>
                <Button
                  icon={<KeyOutlined />}
                  onClick={() => {
                    setDrawerOpen(false);
                    pwdForm.resetFields();
                    setChangePasswordOpen(true);
                  }}
                  style={{ width: '100%', borderRadius: 8 }}
                >
                  Đổi mật khẩu
                </Button>
                <Button
                  danger
                  type="primary"
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    setDrawerOpen(false);
                    logout();
                  }}
                  style={{ width: '100%', borderRadius: 8 }}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setDrawerOpen(false)}>
                  <Button style={{ width: '100%', borderRadius: 8 }}>Đăng nhập</Button>
                </Link>
                <Link to="/register" onClick={() => setDrawerOpen(false)}>
                  <Button type="primary" style={{ width: '100%', borderRadius: 8, background: '#2563eb' }}>Đăng ký</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </Drawer>

      {/* Change Password Modal */}
      <Modal
        open={changePasswordOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyOutlined style={{ color: '#2563eb' }} />
            <span>Đổi mật khẩu tài khoản</span>
          </div>
        }
        onCancel={() => setChangePasswordOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={pwdForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập mật khẩu hiện tại..."
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu phải có từ 6 ký tự trở lên' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập mật khẩu mới..."
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                }
              })
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Nhập lại mật khẩu mới..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <Button onClick={() => setChangePasswordOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={changingPwd}
              style={{ background: '#2563eb' }}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </Form>
      </Modal>
    </header>
  );
}
