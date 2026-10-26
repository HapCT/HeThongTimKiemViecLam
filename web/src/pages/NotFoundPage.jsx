import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
      <Result
        status="404"
        title={<span style={{ fontWeight: 800, fontSize: 32, color: '#0f172a' }}>404 - Không tìm thấy trang</span>}
        subTitle={<span style={{ fontSize: 16, color: '#64748b' }}>Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị thay đổi trong hệ thống việc làm & thực tập UTEHY.</span>}
        extra={
          <Button
            type="primary"
            icon={<HomeOutlined />}
            size="large"
            onClick={() => navigate('/')}
            style={{ borderRadius: 8, background: '#2563eb', fontWeight: 600 }}
          >
            Quay về Trang chủ
          </Button>
        }
      />
    </div>
  );
}
