import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Space,
  Modal,
  Input,
  message,
  Tabs,
  Popconfirm
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  AuditOutlined
} from '@ant-design/icons';
import api from '../api/client';
import JobDetailModal from '../components/JobDetailModal';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AdminJobApprovalPage() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedJob, setSelectedJob] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Detail preview modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/jobs?status=${statusFilter}`);
      if (res?.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (job) => {
    try {
      await api.patch(`/admin/jobs/${job.id}/review`, { status: 'approved' });
      message.success(`Đã phê duyệt tin tuyển dụng: ${job.title}`);
      fetchJobs();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedJob) return;
    setReviewing(true);
    try {
      await api.patch(`/admin/jobs/${selectedJob.id}/review`, {
        status: 'rejected',
        reject_reason: rejectReason || 'Nội dung chưa đầy đủ tiêu chuẩn tuyển dụng'
      });
      message.success('Đã từ chối tin và gửi lý do tới doanh nghiệp');
      setRejectModalOpen(false);
      setRejectReason('');
      fetchJobs();
    } catch (err) {
      message.error(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề tin tuyển dụng',
      key: 'title',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>{record.company_name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {record.category_name} • {record.location}
          </div>
        </div>
      )
    },
    {
      title: 'Mức lương',
      key: 'salary',
      render: (_, record) => {
        if (record.salary_negotiable) return 'Thỏa thuận';
        if (record.salary_min && record.salary_max) {
          return `${record.salary_min / 1000000} - ${record.salary_max / 1000000} tr`;
        }
        return 'Thỏa thuận';
      }
    },
    {
      title: 'Ngày gửi duyệt',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => new Date(d).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const conf = {
          pending: { color: 'gold', text: 'Chờ duyệt' },
          approved: { color: 'green', text: 'Đã duyệt' },
          rejected: { color: 'red', text: 'Đã từ chối' },
          closed: { color: 'default', text: 'Đã đóng' }
        };
        return <Tag color={conf[status]?.color || 'blue'}>{conf[status]?.text || status}</Tag>;
      }
    },
    {
      title: 'Thao tác kiểm duyệt',
      key: 'actions',
      render: (_, record) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedJob(record);
              setDetailModalOpen(true);
            }}
          >
            Xem tin
          </Button>

          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record)}
                style={{ background: '#059669', borderColor: '#059669' }}
              >
                Duyệt
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  setSelectedJob(record);
                  setRejectModalOpen(true);
                }}
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
            Kiểm duyệt tin tuyển dụng
          </Title>
          <Text type="secondary">
            Đảm bảo các tin tuyển dụng đúng định hướng thực tập, minh bạch và an toàn cho sinh viên
          </Text>
        </div>

        <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 20 }}>
          <Tabs
            activeKey={statusFilter}
            onChange={setStatusFilter}
            items={[
              { key: 'pending', label: 'Tin đang chờ duyệt' },
              { key: 'approved', label: 'Tin đã phê duyệt' },
              { key: 'rejected', label: 'Tin đã từ chối' },
              { key: 'all', label: 'Tất cả tin' }
            ]}
          />

          <Table
            columns={columns}
            dataSource={jobs}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
        </Card>
      </div>

      {/* Reject Reason Modal */}
      <Modal
        open={rejectModalOpen}
        title="Từ chối tin tuyển dụng"
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleRejectConfirm}
        confirmLoading={reviewing}
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 12 }}>
          Bạn đang từ chối tin: <strong>{selectedJob?.title}</strong>
        </div>
        <div style={{ marginBottom: 6, fontWeight: 600 }}>Nhập lý do từ chối gửi tới Doanh nghiệp:</div>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="VD: Mô tả công việc chưa rõ ràng; Mức trợ cấp chưa phù hợp với quy định thực tập..."
        />
      </Modal>

      {/* Job Preview Modal */}
      <JobDetailModal
        visible={detailModalOpen}
        job={selectedJob}
        onClose={() => setDetailModalOpen(false)}
      />
    </div>
  );
}
