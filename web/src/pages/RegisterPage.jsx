import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Radio,
  Typography,
  Row,
  Col,
  Space,
  Alert,
  message
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'company' ? 'company' : 'candidate';
  const [role, setRole] = useState(initialRole);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [taxChecking, setTaxChecking] = useState(false);
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'company' || r === 'candidate') {
      setRole(r);
    }
  }, [searchParams]);

  const handleVerifyTaxCode = async () => {
    const code = form.getFieldValue('taxCode');
    if (!code || code.trim().length < 10) {
      message.warning('Vui lòng nhập Mã số thuế gồm 10 hoặc 13 chữ số trước khi bấm kiểm tra');
      return;
    }
    const cleanCode = code.trim().replace(/\s+/g, '');
    setTaxChecking(true);
    try {
      const resp = await fetch(`https://api.vietqr.io/v2/business/${cleanCode}`);
      const resData = await resp.json();
      if (resData?.code === '00' && resData?.data) {
        const info = resData.data;
        setTaxResult({
          verified: true,
          name: info.name,
          address: info.address,
          status: info.status || 'NNT đang hoạt động'
        });
        form.setFieldsValue({
          companyName: info.name,
          address: info.address
        });
        message.success('Đã xác thực thành công dữ liệu Cục Thuế! Tên công ty và trụ sở đã được điền tự động.');
      } else {
        setTaxResult({
          verified: false,
          error: resData?.desc || 'Mã số thuế không tồn tại trên Cổng Dữ Liệu Thuế Quốc Gia hoặc đã ngừng hoạt động'
        });
        message.error('Mã số thuế không tồn tại trên hệ thống Thuế Việt Nam!');
      }
    } catch (err) {
      message.error('Không thể kết nối đến máy chủ Cổng Thuế');
    } finally {
      setTaxChecking(false);
    }
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        email: values.email,
        password: values.password,
        role: role,
        phone: values.phone,
        ...(role === 'candidate'
          ? {
              fullName: values.fullName,
              university: values.university || 'ĐH Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
              major: values.major || 'Công nghệ thông tin'
            }
          : {
              companyName: values.companyName,
              taxCode: values.taxCode,
              website: values.website,
              address: values.address
            })
      };

      const res = await register(payload);
      if (res?.success) {
        if (role === 'company') {
          navigate('/company/dashboard');
        } else {
          navigate('/candidate/profile');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        {/* Brand Header */}
        <div className="register-brand-header">
          <Title level={2} className="register-brand-title">
            Job<span className="register-brand-accent">UTEHY</span>
          </Title>
          <Text className="register-brand-subtitle">
            Tạo Tài Khoản Hệ Thống & Phân Quyền Vai Trò
          </Text>
        </div>

        <Card className="register-card">
          <div className="register-card-header">
            <Title level={3} className="register-card-title">
              Đăng Ký Tài Khoản Mới
            </Title>
            <Text type="secondary" className="register-card-desc">
              Dữ liệu được lưu trữ trực tiếp vào cơ sở dữ liệu MySQL
            </Text>
          </div>

          {/* Role selector */}
          <div className="register-role-section">
            <label className="register-role-label">
              CHỌN VAI TRÒ THAM GIA:
            </label>
            <Radio.Group
              value={role}
              onChange={(e) => setRole(e.target.value)}
              buttonStyle="solid"
              className="register-role-group"
              size="large"
            >
              <Radio.Button value="candidate" className="register-role-btn">
                Sinh viên tìm việc
              </Radio.Button>
              <Radio.Button value="company" className="register-role-btn">
                Doanh nghiệp
              </Radio.Button>
            </Radio.Group>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="register-form"
            initialValues={{
              university: 'ĐH Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
              major: 'Công nghệ thông tin'
            }}
          >
            {role === 'candidate' ? (
              <Form.Item
                name="fullName"
                label="Họ và tên sinh viên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input
                  prefix={<UserOutlined className="register-input-icon" />}
                  placeholder="Ví dụ: Trần Văn Nam"
                  size="large"
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item
                  name="taxCode"
                  label="Mã số thuế doanh nghiệp (MST)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập Mã số thuế để xác thực pháp nhân!' },
                    { pattern: /^[0-9]{10}(-[0-9]{3})?$|^[0-9]{13}$/, message: 'Mã số thuế gồm 10 hoặc 13 chữ số (VD: 0101248141 hoặc 0100109106)' }
                  ]}
                  extra="Nhập MST và bấm 'Xác thực với Cục Thuế' để tự động kiểm tra tính hợp pháp trên Cổng Quốc Gia."
                >
                  <Space.Compact className="register-tax-compact">
                    <Input
                      placeholder="VD: 0101248141 (FPT), 0100109106 (Viettel)..."
                      size="large"
                      className="register-tax-input"
                    />
                    <Button
                      type="primary"
                      size="large"
                      loading={taxChecking}
                      onClick={handleVerifyTaxCode}
                      className="register-tax-btn"
                    >
                      Xác thực với Cục Thuế
                    </Button>
                  </Space.Compact>
                </Form.Item>

                {taxResult && (
                  <div className="register-tax-result">
                    {taxResult.verified ? (
                      <Alert
                        type="success"
                        showIcon
                        message="ĐÃ XÁC THỰC PHÁP NHÂN CỤC THUẾ VIỆT NAM"
                        description={
                          <div className="register-tax-result-content">
                            <div>• Tên pháp nhân: <strong>{taxResult.name}</strong></div>
                            <div>• Trạng thái: <span className="register-tax-result-status">{taxResult.status}</span></div>
                            <div>• Địa chỉ thuế: {taxResult.address}</div>
                          </div>
                        }
                      />
                    ) : (
                      <Alert
                        type="error"
                        showIcon
                        message="CẢNH BÁO MÃ SỐ THUẾ KHÔNG TỒN TẠI"
                        description={taxResult.error}
                      />
                    )}
                  </div>
                )}

                <Form.Item
                  name="companyName"
                  label="Tên doanh nghiệp / Công ty"
                  rules={[{ required: true, message: 'Vui lòng nhập tên công ty' }]}
                  extra={taxResult?.verified ? 'Đã tự động điền từ cơ sở dữ liệu Thuế' : undefined}
                >
                  <Input
                    prefix={<BankOutlined className="register-input-icon" />}
                    placeholder="Ví dụ: Công ty Cổ phần FPT"
                    size="large"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không đúng định dạng!' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="register-input-icon" />}
                placeholder={role === 'candidate' ? 'sinhvien@utehy.edu.vn' : 'hr@company.com'}
                size="large"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Tối thiểu 6 ký tự' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="register-input-icon" />}
                    placeholder="••••••••"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                      }
                    })
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="register-input-icon" />}
                    placeholder="••••••••"
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="phone"
              label="Số điện thoại liên hệ"
              rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
            >
              <Input
                prefix={<PhoneOutlined className="register-input-icon" />}
                placeholder="0987654321"
                size="large"
              />
            </Form.Item>

            {role === 'candidate' && (
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="university" label="Trường đại học">
                    <Input prefix={<BankOutlined className="register-input-icon" />} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="major" label="Chuyên ngành">
                    <Input prefix={<BookOutlined className="register-input-icon" />} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {role === 'company' && (
              <>
                <Form.Item
                  name="website"
                  label="Website chính thức"
                >
                  <Input placeholder="https://congtyabc.com" size="large" />
                </Form.Item>

                <Form.Item
                  name="address"
                  label="Địa chỉ trụ sở công ty"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ trụ sở chính' }]}
                  extra={taxResult?.verified ? 'Đã tự động điền từ cơ sở dữ liệu Thuế' : undefined}
                >
                  <Input placeholder="Tầng 12, Keangnam Landmark, Hà Nội" size="large" />
                </Form.Item>
              </>
            )}

            <Button
              type="primary"
              htmlType="submit"
              icon={<CheckCircleOutlined />}
              loading={submitting}
              block
              size="large"
              className="register-submit-btn"
            >
              Đăng ký tài khoản ({role === 'candidate' ? 'Sinh viên' : 'Doanh nghiệp'})
            </Button>
          </Form>

          <div className="register-footer">
            Đã có tài khoản?{' '}
            <Link to="/login" className="register-footer-link">
              Đăng nhập tại đây
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
