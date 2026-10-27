import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Typography, Button, Space, Tooltip, message } from 'antd';
import {
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  HeartFilled,
  SendOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isDeadlinePassed } from '../utils/jobDeadline';

const { Title } = Typography;

export default function JobCard({ job, onSelect }) {
  const navigate = useNavigate();
  const { isCandidate } = useAuth();
  const [saved, setSaved] = useState(Boolean(job.is_saved));
  const [saving, setSaving] = useState(false);

  const formatSalary = () => {
    if (job.salary_negotiable) return 'Thỏa thuận';
    if (job.salary_min && job.salary_max) {
      return `${(job.salary_min / 1000000).toLocaleString()} - ${(job.salary_max / 1000000).toLocaleString()} triệu`;
    }
    if (job.salary_min) return `Từ ${(job.salary_min / 1000000).toLocaleString()} triệu`;
    if (job.salary_max) return `Tới ${(job.salary_max / 1000000).toLocaleString()} triệu`;
    return 'Thỏa thuận';
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!isCandidate) {
      message.warning('Vui lòng chọn vai trò Sinh viên để lưu việc làm');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/saved-jobs/toggle', { job_id: job.id });
      if (res?.data) {
        setSaved(res.data.is_saved);
        message.success(res.message);
      }
    } catch (err) {
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const jobTypeLabels = {
    internship: { text: 'Thực tập sinh', color: 'blue' },
    full_time: { text: 'Toàn thời gian', color: 'green' },
    part_time: { text: 'Bán thời gian', color: 'orange' }
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(job);
    } else if (job.id) {
      navigate(`/jobs/${job.id}`);
    }
  };

  const handleCompanyClick = (e) => {
    if (job.company_id) {
      e.stopPropagation();
      navigate(`/companies/${job.company_id}`);
    }
  };

  return (
    <Card
      hoverable
      className="hover-lift"
      onClick={handleCardClick}
      style={{
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        marginBottom: 16,
        background: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Company Logo */}
        <div
          onClick={handleCompanyClick}
          style={{
            width: 58,
            height: 58,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            flexShrink: 0,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            cursor: job.company_id ? 'pointer' : 'default'
          }}
        >
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={job.company_name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/100x100?text=Logo';
              }}
            />
          ) : (
            <div style={{ fontWeight: 800, color: '#3b82f6', fontSize: 18 }}>
              {job.company_name ? job.company_name.charAt(0) : 'DN'}
            </div>
          )}
        </div>

        {/* Content details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <Title
                level={5}
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: '#0f172a',
                  fontWeight: 700,
                  lineHeight: 1.4
                }}
              >
                {job.title}
              </Title>
              <div
                onClick={handleCompanyClick}
                style={{
                  color: '#475569',
                  fontSize: 13,
                  marginTop: 2,
                  fontWeight: 500,
                  cursor: job.company_id ? 'pointer' : 'default',
                  display: 'inline-block'
                }}
              >
                {job.company_name}
              </div>
            </div>

            {/* Save Heart Button */}
            <Tooltip title={saved ? 'Bỏ lưu' : 'Lưu tin tuyển dụng'}>
              <Button
                type="text"
                shape="circle"
                loading={saving}
                onClick={handleToggleSave}
                icon={
                  saved ? (
                    <HeartFilled style={{ color: '#ef4444', fontSize: 20 }} />
                  ) : (
                    <HeartOutlined style={{ color: '#94a3b8', fontSize: 20 }} />
                  )
                }
              />
            </Tooltip>
          </div>

          {/* Badges / Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <Tag color={jobTypeLabels[job.job_type]?.color || 'blue'} style={{ borderRadius: 6, fontWeight: 600 }}>
              {jobTypeLabels[job.job_type]?.text || job.job_type}
            </Tag>

            {job.category_name && (
              <Tag style={{ borderRadius: 6, background: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 600 }}>
                {job.category_name}
              </Tag>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 700, fontSize: 13, background: '#ecfdf5', padding: '2px 8px', borderRadius: 6 }}>
              <DollarOutlined />
              {formatSalary()}
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 12 }}>
              <EnvironmentOutlined />
              {job.location}
            </div>
          </div>

          {/* Bottom stats & applied state */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
              fontSize: 12,
              color: '#94a3b8'
            }}
          >
            <Space size={[16, 4]} wrap>
              <span>
                <UsergroupAddOutlined style={{ marginRight: 4 }} />
                {job.applicant_count || 0} hồ sơ đã ứng tuyển
              </span>
              {job.deadline && (
                <span>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Hạn nộp: {new Date(job.deadline).toLocaleDateString('vi-VN')}
                  {isDeadlinePassed(job.deadline) && (
                    <Tag color="error" style={{ marginLeft: 6, borderRadius: 4, fontSize: 11 }}>
                      Đã hết hạn
                    </Tag>
                  )}
                </span>
              )}
            </Space>

            {job.application_status ? (
              <Tag color="cyan" style={{ borderRadius: 6, fontWeight: 600 }}>
                ĐÃ ỨNG TUYỂN ({job.application_status.toUpperCase()})
              </Tag>
            ) : (job.status === 'closed' || isDeadlinePassed(job.deadline)) ? (
              <Tag color="default" style={{ borderRadius: 6, fontWeight: 600 }}>
                HẾT HẠN ỨNG TUYỂN
              </Tag>
            ) : (
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                style={{ padding: 0, fontWeight: 600, color: '#2563eb' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect(job, true); // true = open apply
                }}
              >
                Ứng tuyển ngay →
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
