import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Typography
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || null;

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const res = await login(values.email, values.password);
      if (res?.success) {
        if (res.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'company') {
          navigate('/company/dashboard');
        } else {
          navigate(redirectUrl && !redirectUrl.startsWith('/company') && !redirectUrl.startsWith('/admin') ? redirectUrl : '/jobs');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Brand Header */}
        <div className="login-brand-header">
          <Title level={2} className="login-brand-title">
            Job<span className="login-brand-accent">UTEHY</span>
          </Title>
          <Text className="login-brand-subtitle">
            Cổng Đăng Nhập Hệ Thống Việc Làm & Thực Tập Sinh Viên
          </Text>
        </div>

        <Card className="login-card">
          <div className="login-card-header">
            <Title level={3} className="login-card-title">
              Đăng Nhập
            </Title>
            <Text type="secondary" className="login-card-desc">
              Nhập email và mật khẩu để tiếp tục
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="login-form"
          >
            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="login-input-icon" />}
                placeholder="Nhập email của bạn..."
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="login-input-icon" />}
                placeholder="••••••••"
                size="large"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              loading={submitting}
              block
              size="large"
              className="login-submit-btn"
            >
              Đăng nhập
            </Button>
          </Form>

          <div className="login-footer">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="login-footer-link">
              Đăng ký tài khoản mới
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
