import React from 'react';
import { Typography, Row, Col, Space } from 'antd';
import { BankOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', paddingTop: 48, paddingBottom: 24, marginTop: 'auto', borderTop: '1px solid #1e293b' }}>
      <div className="app-container">
        <Row gutter={[32, 32]}>
          <Col xs={24} md={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', letterSpacing: -0.5 }}>
                Job<span style={{ color: '#60a5fa' }}>UTEHY</span>
              </span>
            </div>
            <Paragraph style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
              Đề tài Đồ án 4: <strong>"Xây dựng hệ thống hỗ trợ tìm kiếm việc làm và thực tập cho sinh viên"</strong>.
              Nền tảng kết nối trực tiếp sinh viên có nhu cầu thực tập và doanh nghiệp tuyển dụng công nghệ hàng đầu.
            </Paragraph>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#cbd5e1' }}>
              <div><EnvironmentOutlined style={{ marginRight: 8, color: '#3b82f6' }} /> Trường Đại học Sư phạm Kỹ thuật Hưng Yên</div>
              <div><BankOutlined style={{ marginRight: 8, color: '#3b82f6' }} /> Khoa Công nghệ thông tin - Bộ môn Kỹ thuật phần mềm</div>
            </div>
          </Col>

          <Col xs={24} md={7}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
              Thông tin Đồ án
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div>Sinh viên thực hiện: <strong style={{ color: '#ffffff' }}>Phạm Huy Anh</strong></div>
              <div>Mã số sinh viên: <strong style={{ color: '#60a5fa' }}>12523003</strong></div>
              <div>Mã lớp: <strong style={{ color: '#ffffff' }}>12523W.4</strong></div>
              <div>Giảng viên hướng dẫn: <strong style={{ color: '#34d399' }}>ThS. Nguyễn Hoàng Điệp</strong></div>
              <div>Năm thực hiện: <strong style={{ color: '#ffffff' }}>2026</strong></div>
            </div>
          </Col>

          <Col xs={24} md={7}>
            <Title level={5} style={{ color: '#ffffff', marginBottom: 16 }}>
              Công nghệ ứng dụng
            </Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div>• <strong>Cơ sở dữ liệu</strong>: MySQL 8.0 (12 bảng quan hệ chặt)</div>
              <div>• <strong>Back-end</strong>: Node.js & Express RESTful API</div>
              <div>• <strong>Web Portal</strong>: React 19 + Ant Design 6 + Vite</div>
              <div>• <strong>Mobile App</strong>: React Native (Expo Router)</div>
              <div>• <strong>Realtime & Auth</strong>: Firebase Authentication & Storage</div>
            </div>
          </Col>
        </Row>

        <div
          style={{
            marginTop: 40,
            paddingTop: 20,
            borderTop: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 13
          }}
        >
          <div>© 2026 JobUTEHY - Bản quyền thuộc về Phạm Huy Anh (12523003) - UTEHY.</div>
          <div style={{ color: '#64748b' }}>Đồ án tốt nghiệp / Đồ án chuyên ngành Kỹ thuật phần mềm</div>
        </div>
      </div>
    </footer>
  );
}
