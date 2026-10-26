import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Space,
  Popconfirm,
  Statistic,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit job
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Quick add new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    fetchData();
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes, catsRes] = await Promise.all([
        api.get('/stats/company'),
        api.get('/jobs/company/my-jobs'),
        api.get('/categories')
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (jobsRes?.data) setJobs(jobsRes.data);
      if (catsRes?.data) setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newCategoryName || !newCategoryName.trim()) {
      message.warning('Vui lòng nhập tên ngành nghề mới');
      return;
    }
    setAddingCategory(true);
    try {
      const res = await api.post('/categories', { name: newCategoryName.trim() });
      if (res?.data?.data) {
        const addedCat = res.data.data;
        const exists = categories.some((c) => c.id === addedCat.id);
        if (!exists) {
          setCategories((prev) => [...prev, addedCat]);
        }
        form.setFieldValue('category_id', addedCat.id);
        message.success(
          res.data.alreadyExists
            ? 'Ngành nghề này đã có sẵn và đã được chọn tự động!'
            : 'Đã thêm và chọn ngành nghề mới thành công!'
        );
        setNewCategoryName('');
      }
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Không thể thêm ngành nghề mới');
    } finally {
      setAddingCategory(false);
    }
  };

  const openCreateModal = () => {
    setEditingJob(null);
    form.resetFields();
    form.setFieldsValue({
      job_type: 'internship',
      location: 'Hà Nội',
      quantity: 3,
      salary_min: 5000000,
      salary_max: 9000000,
      deadline: dayjs().add(30, 'day'),
      status: 'approved'
    });
    setJobModalOpen(true);
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    form.setFieldsValue({
      title: job.title,
      category_id: job.category_id,
      job_type: job.job_type,
      location: job.location,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_negotiable: Boolean(job.salary_negotiable),
      quantity: job.quantity,
      deadline: job.deadline ? dayjs(job.deadline) : null,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      status: job.status
    });
    setJobModalOpen(true);
  };

  const handleSubmitJob = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : null
      };

      if (editingJob) {
        await api.put(`/jobs/${editingJob.id}`, payload);
        message.success('Cập nhật tin tuyển dụng thành công');
      } else {
        await api.post('/jobs', payload);
        message.success('Đăng tin tuyển dụng mới thành công');
      }

      setJobModalOpen(false);
      fetchData();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleJobStatus = async (job) => {
    const nextStatus = job.status === 'closed' ? 'approved' : 'closed';
    try {
      await api.patch(`/jobs/${job.id}/status`, { status: nextStatus });
      message.success(`Đã chuyển trạng thái tin sang: ${nextStatus}`);
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDeleteJob = async (id) => {
    try {
      await api.delete(`/jobs/${id}`);
      message.success('Đã xóa tin tuyển dụng');
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề tin tuyển dụng',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {record.category_name} • {record.location}
          </div>
        </div>
      )
    },
    {
      title: 'Lượt xem',
      dataIndex: 'view_count',
      key: 'view_count',
      render: (v) => <span>{v || 0} lượt</span>
    },
    {
      title: 'Ứng viên nộp',
      key: 'applicants',
      render: (_, record) => (
        <Button
          type="link"
          icon={<TeamOutlined />}
          onClick={() => navigate(`/company/applicants?job_id=${record.id}`)}
          style={{ fontWeight: 700, padding: 0 }}
        >
          {record.applicant_count || 0} ứng viên
        </Button>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        let color = 'default';
        let label = 'Đã đóng';
        if (status === 'approved') {
          color = 'green';
          label = 'Đang tuyển';
        } else if (status === 'pending') {
          color = 'gold';
          label = 'Chờ duyệt';
        } else if (status === 'rejected') {
          color = 'red';
          label = 'Bị từ chối';
        }
        return (
          <div>
            <Tag color={color} style={{ borderRadius: 6, fontWeight: 700 }}>{label}</Tag>
            {status === 'rejected' && record.reject_reason && (
              <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4, maxWidth: 160 }}>
                Lý do: {record.reject_reason}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (d) => {
        if (!d) return <span style={{ color: '#64748b' }}>Không giới hạn</span>;
        const isExpired = dayjs(d).isBefore(dayjs(), 'day');
        return isExpired ? (
          <Tag color="error" style={{ borderRadius: 6, fontWeight: 700 }}>
            Hết hạn ({dayjs(d).format('DD/MM/YYYY')})
          </Tag>
        ) : (
          <span style={{ color: '#0f172a', fontWeight: 600 }}>
            {dayjs(d).format('DD/MM/YYYY')}
          </span>
        );
      }
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Button
            size="small"
            onClick={() => handleToggleJobStatus(record)}
            style={{ fontSize: 12 }}
          >
            {record.status === 'closed' ? 'Mở lại' : 'Đóng tin'}
          </Button>
          <Popconfirm
            title="Xóa tin này?"
            onConfirm={() => handleDeleteJob(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        {/* Header Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Bảng điều khiển Nhà tuyển dụng
            </Title>
            <Text type="secondary">
              Quản lý các chiến dịch tuyển dụng thực tập sinh và ứng viên của {user?.company_name}
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{ borderRadius: 8, background: '#2563eb', fontWeight: 700, height: 42, padding: '0 20px' }}
          >
            Đăng tin tuyển dụng mới
          </Button>
        </div>

        {/* Metrics Row */}
        <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Tổng tin đã đăng"
                value={stats?.summary?.total_jobs || jobs.length}
                valueStyle={{ color: '#0f172a', fontWeight: 800 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Tin đang hoạt động"
                value={stats?.summary?.active_jobs || jobs.filter(j => j.status === 'approved').length}
                valueStyle={{ color: '#059669', fontWeight: 800 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Hồ sơ ứng viên nộp"
                value={stats?.summary?.total_applications || 0}
                valueStyle={{ color: '#2563eb', fontWeight: 800 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <Statistic
                title="Lịch phỏng vấn đã xếp"
                value={stats?.summary?.total_interviews || 0}
                valueStyle={{ color: '#7c3aed', fontWeight: 800 }}
              />
            </Card>
          </Col>
        </Row>

        {/* Jobs Table */}
        <Card
          title={<span style={{ fontWeight: 800, fontSize: 16 }}>Danh sách tin tuyển dụng ({jobs.length})</span>}
          style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
          bodyStyle={{ padding: 20 }}
        >
          <Table
            columns={columns}
            dataSource={jobs}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>

      {/* Modal Create / Edit Job */}
      <Modal
        open={jobModalOpen}
        title={editingJob ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng thực tập mới'}
        onCancel={() => setJobModalOpen(false)}
        footer={null}
        width={780}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitJob}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="VD: Thực tập sinh Node.js / ReactJS Developer" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label={
                  <Space>
                    <span>Ngành nghề</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>(Có thể chọn hoặc tự thêm mới)</Text>
                  </Space>
                }
                rules={[{ required: true, message: 'Chọn ngành nghề' }]}
              >
                <Select
                  placeholder="Chọn ngành nghề có sẵn hoặc thêm mới..."
                  showSearch
                  optionFilterProp="children"
                  dropdownRender={(menu) => (
                    <>
                      {menu}
                      <Divider style={{ margin: '8px 0' }} />
                      <Space style={{ padding: '4px 8px 8px', width: '100%', display: 'flex' }}>
                        <Input
                          placeholder="Nhập tên ngành nghề mới..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewCategory(e);
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          loading={addingCategory}
                          onClick={handleAddNewCategory}
                        >
                          Thêm
                        </Button>
                      </Space>
                    </>
                  )}
                >
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="job_type" label="Hình thức làm việc">
                <Select>
                  <Option value="internship">Thực tập sinh (Internship)</Option>
                  <Option value="full_time">Toàn thời gian (Full-time)</Option>
                  <Option value="part_time">Bán thời gian (Part-time)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="location"
                label="Địa điểm làm việc"
                rules={[{ required: true, message: 'Nhập địa điểm' }]}
              >
                <Input placeholder="Hà Nội / Hưng Yên / TP.HCM" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="quantity" label="Số lượng tuyển">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="deadline"
                label="Hạn nộp hồ sơ"
                rules={[{ required: true, message: 'Vui lòng chọn hạn nộp hồ sơ' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày hết hạn"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salary_min" label="Mức lương / Trợ cấp tối thiểu (VNĐ)">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                  step={500000}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary_max" label="Mức lương / Trợ cấp tối đa (VNĐ)">
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(val) => val.replace(/\$\s?|(,*)/g, '')}
                  step={500000}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả công việc"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả công việc' }]}
          >
            <TextArea rows={4} placeholder="Chi tiết các đầu việc, dự án tham gia..." />
          </Form.Item>

          <Form.Item name="requirements" label="Yêu cầu ứng viên">
            <TextArea rows={4} placeholder="Kiến thức nền tảng, kỹ năng công nghệ, tinh thần thái độ..." />
          </Form.Item>

          <Form.Item name="benefits" label="Quyền lợi & Phúc lợi">
            <TextArea rows={3} placeholder="Mức trợ cấp, cơ hội lên chính thức, trang thiết bị, dấu thực tập..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={() => setJobModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#2563eb' }}>
              {editingJob ? 'Lưu thay đổi' : 'Đăng tin tuyển dụng'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
