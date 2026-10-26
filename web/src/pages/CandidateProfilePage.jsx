import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  DatePicker,
  Typography,
  Avatar,
  message,
  Tag,
  Divider
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  BankOutlined,
  BookOutlined,
  TrophyOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CandidateProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        full_name: user.candidate_name || user.full_name,
        phone: user.phone,
        gender: user.gender || 'male',
        birth_date: user.birth_date ? dayjs(user.birth_date) : null,
        address: user.address,
        university: user.university || 'Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
        major: user.major || 'Kỹ thuật phần mềm',
        graduation_year: user.graduation_year || 2026,
        gpa: user.gpa || 3.65,
        bio: user.bio,
        avatar_url: user.avatar_url
      });
    }
  }, [user]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null
      };
      await updateProfile(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Hồ sơ sinh viên
          </Title>
          <Text type="secondary">
            Cập nhật thông tin học vấn và kinh nghiệm để nhà tuyển dụng đánh giá hồ sơ
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {/* Left Summary Card */}
          <Col xs={24} md={8}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}
              bodyStyle={{ padding: 28 }}
            >
              <Avatar
                size={100}
                src={user?.avatar_url}
                icon={<UserOutlined />}
                style={{
                  background: '#2563eb',
                  border: '4px solid #dbeafe',
                  marginBottom: 16
                }}
              />
              <Title level={4} style={{ margin: 0, fontWeight: 800 }}>
                {user?.candidate_name || 'Phạm Huy Anh'}
              </Title>
              <div style={{ color: '#2563eb', fontWeight: 600, fontSize: 13, marginTop: 4 }}>
                {user?.major || 'Kỹ thuật phần mềm'}
              </div>
              <Tag color="blue" style={{ borderRadius: 6, marginTop: 8 }}>
                Sinh viên UTEHY (Khóa 2022 - 2026)
              </Tag>

              <Divider style={{ margin: '18px 0' }} />

              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#475569' }}>
                <div><BankOutlined style={{ marginRight: 8, color: '#2563eb' }} /> {user?.university || 'ĐH SPKT Hưng Yên'}</div>
                <div><TrophyOutlined style={{ marginRight: 8, color: '#f59e0b' }} /> Điểm GPA tích lũy: <strong style={{ color: '#0f172a' }}>{user?.gpa || '3.65'}/4.0</strong></div>
                <div><PhoneOutlined style={{ marginRight: 8, color: '#10b981' }} /> {user?.phone || '0987654321'}</div>
                <div><EnvironmentOutlined style={{ marginRight: 8, color: '#6366f1' }} /> {user?.address || 'Hưng Yên / Hà Nội'}</div>
              </div>
            </Card>
          </Col>

          {/* Right Form Card */}
          <Col xs={24} md={16}>
            <Card
              style={{
                borderRadius: 16,
                border: '1px solid #e2e8f0'
              }}
              bodyStyle={{ padding: 28 }}
            >
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="full_name"
                      label="Họ và tên"
                      rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                      <Input placeholder="Phạm Huy Anh" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Số điện thoại liên hệ">
                      <Input placeholder="0987654321" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="birth_date" label="Ngày sinh">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="gender" label="Giới tính">
                      <Select>
                        <Option value="male">Nam</Option>
                        <Option value="female">Nữ</Option>
                        <Option value="other">Khác</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="university" label="Trường đại học">
                      <Input placeholder="Trường ĐH Sư phạm Kỹ thuật Hưng Yên" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="major" label="Chuyên ngành">
                      <Input placeholder="Kỹ thuật phần mềm" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="gpa" label="Điểm trung bình (GPA thang 4.0)">
                      <InputNumber min={0} max={4} step={0.01} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="graduation_year" label="Năm tốt nghiệp dự kiến">
                      <InputNumber min={2020} max={2035} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="address" label="Địa chỉ hiện tại">
                  <Input placeholder="Thành phố Hưng Yên / Cầu Giấy, Hà Nội" />
                </Form.Item>

                <Form.Item name="avatar_url" label="Đường dẫn ảnh đại diện (Avatar URL)">
                  <Input placeholder="https://..." />
                </Form.Item>

                <Form.Item name="bio" label="Giới thiệu bản thân & Mục tiêu nghề nghiệp">
                  <TextArea rows={4} placeholder="Tóm tắt ngắn gọn kỹ năng, dự án tâm đắc và định hướng thực tập..." />
                </Form.Item>

                <div style={{ textAlign: 'right', marginTop: 16 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={loading}
                    style={{ background: '#2563eb', padding: '0 28px', height: 42, borderRadius: 8, fontWeight: 600 }}
                  >
                    Lưu thông tin hồ sơ
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
