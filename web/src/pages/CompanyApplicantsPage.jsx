import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  message,
  Space,
  Avatar
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api/client';
import { downloadCVAsPDF } from '../utils/cvExporter';
import { useAuth } from '../context/AuthContext';
import { fetchProtectedCvBlobUrl, openProtectedCvInNewTab } from '../api/fileHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CompanyApplicantsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(searchParams.get('job_id') || '');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusForm] = Form.useForm();

  // Interview schedule modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewForm] = Form.useForm();
  const interviewFormat = Form.useWatch('format', interviewForm);
  const [scheduling, setScheduling] = useState(false);

  // CV View modal
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [viewingCv, setViewingCv] = useState(null);
  const [cvBlobUrl, setCvBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let blobUrl = null;
    if (viewingCv?.cv_file_url) {
      fetchProtectedCvBlobUrl(viewingCv.cv_file_url)
        .then((url) => {
          if (active) {
            blobUrl = url;
            setCvBlobUrl(url);
          } else {
            URL.revokeObjectURL(url);
          }
        })
        .catch((err) => {
          if (active) {
            setCvBlobUrl(null);
            message.error(err.message);
          }
        });
    } else {
      setCvBlobUrl(null);
    }
    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [viewingCv]);

  useEffect(() => {
    fetchJobs();
    fetchApplicants();
  }, [selectedJobId, selectedStatus]);

  async function fetchJobs() {
    try {
      const res = await api.get('/jobs/company/my-jobs');
      if (res?.data) setJobs(res.data);
    } catch {}
  }

  async function fetchApplicants() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedJobId) params.append('job_id', selectedJobId);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await api.get(`/applications/company/all?${params.toString()}`);
      if (res?.data) {
        setApplicants(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const openStatusModal = (record) => {
    setSelectedApp(record);
    statusForm.setFieldsValue({
      status: record.status,
      note: record.note || ''
    });
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (values) => {
    if (!selectedApp) return;
    try {
      await api.patch(`/applications/${selectedApp.id}/status`, values);
      message.success('Đã cập nhật trạng thái hồ sơ');
      setStatusModalOpen(false);
      fetchApplicants();
    } catch (err) {
      message.error(err.message);
    }
  };

  const openInterviewModal = (record) => {
    setSelectedApp(record);
    const companyAddress = user?.company_address || user?.address || 'Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội';
    interviewForm.setFieldsValue({
      scheduled_at: dayjs().add(2, 'day').hour(9).minute(30),
      format: 'offline',
      location: companyAddress,
      note: 'Phỏng vấn chuyên môn và trao đổi kế hoạch thực tập'
    });
    setInterviewModalOpen(true);
  };

  const handleScheduleInterview = async (values) => {
    if (!selectedApp) return;
    setScheduling(true);
    try {
      await api.post('/interviews', {
        application_id: selectedApp.id,
        scheduled_at: values.scheduled_at.format('YYYY-MM-DD HH:mm:ss'),
        format: values.format,
        location: values.location,
        note: values.note
      });
      message.success('Đã xếp lịch phỏng vấn và gửi thông báo tới ứng viên');
      setInterviewModalOpen(false);
      fetchApplicants();
    } catch (err) {
      message.error(err.message);
    } finally {
      setScheduling(false);
    }
  };

  const openCvView = (record) => {
    setViewingCv(record);
    setCvModalOpen(true);
  };

  const statusConfig = {
    submitted: { color: 'gold', text: 'Chờ duyệt' },
    viewed: { color: 'blue', text: 'Đã xem' },
    interview: { color: 'purple', text: 'Mời phỏng vấn' },
    accepted: { color: 'green', text: 'Tiếp nhận' },
    rejected: { color: 'red', text: 'Từ chối' }
  };

  const columns = [
    {
      title: 'Ứng viên',
      key: 'candidate',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Avatar
            size={42}
            src={record.candidate_avatar}
            icon={<UserOutlined />}
            style={{ background: '#2563eb' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.candidate_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {record.university} {record.gpa ? `• GPA: ${record.gpa}` : ''}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.candidate_email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Vị trí ứng tuyển',
      dataIndex: 'job_title',
      key: 'job_title',
      render: (t) => <strong style={{ color: '#0f172a' }}>{t}</strong>
    },
    {
      title: 'Hồ sơ CV',
      key: 'cv',
      render: (_, record) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => openCvView(record)}
          style={{ padding: 0, fontWeight: 600 }}
        >
          {record.cv_title}
        </Button>
      )
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'applied_at',
      key: 'applied_at',
      render: (d) => new Date(d).toLocaleDateString('vi-VN')
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusConfig[status]?.color || 'blue'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {statusConfig[status]?.text || status}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size={8}>
          <Button size="small" onClick={() => openStatusModal(record)}>
            Cập nhật
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => openInterviewModal(record)}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          >
            Hẹn PV
          </Button>
        </Space>
      )
    }
  ];

  const handleExportExcel = async () => {
    if (applicants.length === 0) {
      message.warning('Không có dữ liệu ứng viên để xuất');
      return;
    }
    const data = applicants.map((a, idx) => ({
      'STT': idx + 1,
      'Họ và tên': a.candidate_name,
      'Vị trí ứng tuyển': a.job_title,
      'Email': a.candidate_email,
      'Số điện thoại': a.candidate_phone,
      'Trường đào tạo': a.university,
      'Chuyên ngành': a.major,
      'GPA': a.gpa,
      'Trạng thái': a.status === 'accepted' ? 'Trúng tuyển' : a.status === 'interview' ? 'Mời phỏng vấn' : a.status === 'viewed' ? 'Đã xem' : a.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt',
      'Ngày nộp hồ sơ': new Date(a.applied_at).toLocaleDateString('vi-VN'),
      'Ghi chú': a.note || ''
    }));

    const XLSX = await import('xlsx');

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UngVien');
    XLSX.writeFile(workbook, `Danh_sach_ung_vien_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success('Xuất file Excel danh sách ứng viên thành công!');
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Quản lý hồ sơ ứng viên
            </Title>
            <Text type="secondary">
              Xem xét hồ sơ, tiếp nhận sinh viên và xếp lịch phỏng vấn
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportExcel}
              style={{ color: '#059669', borderColor: '#059669', fontWeight: 600, height: 38, borderRadius: 8 }}
            >
              Xuất Excel danh sách
            </Button>

            <Select
              placeholder="Lọc theo tin tuyển dụng"
              value={selectedJobId || undefined}
              onChange={setSelectedJobId}
              allowClear
              style={{ width: 220 }}
            >
              {jobs.map((j) => (
                <Option key={j.id} value={j.id}>{j.title}</Option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ width: 160 }}
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="submitted">Chờ duyệt</Option>
              <Option value="viewed">Đã xem</Option>
              <Option value="interview">Mời phỏng vấn</Option>
              <Option value="accepted">Đã tiếp nhận</Option>
              <Option value="rejected">Từ chối</Option>
            </Select>
          </div>
        </div>

        <Card
          style={{ borderRadius: 16, border: '1px solid #e2e8f0' }}
          bodyStyle={{ padding: 20 }}
        >
          <Table
            columns={columns}
            dataSource={applicants}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: true }}
          />
        </Card>
      </div>

      {/* Status Update Modal */}
      <Modal
        open={statusModalOpen}
        title="Cập nhật trạng thái duyệt hồ sơ"
        onCancel={() => setStatusModalOpen(false)}
        footer={null}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus} style={{ marginTop: 16 }}>
          <Form.Item name="status" label="Trạng thái ứng tuyển">
            <Select>
              <Option value="submitted">Chờ duyệt</Option>
              <Option value="viewed">Đã xem hồ sơ</Option>
              <Option value="interview">Mời phỏng vấn</Option>
              <Option value="accepted">Tiếp nhận thực tập (Trúng tuyển)</Option>
              <Option value="rejected">Từ chối hồ sơ</Option>
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú phản hồi cho sinh viên">
            <TextArea rows={4} placeholder="Nhập nhận xét hoặc thông tin bổ sung cho ứng viên..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setStatusModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#2563eb' }}>
              Lưu trạng thái
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Schedule Interview Modal */}
      <Modal
        open={interviewModalOpen}
        title={<span style={{ fontWeight: 700, fontSize: 16 }}>Xếp lịch phỏng vấn cho ứng viên</span>}
        onCancel={() => setInterviewModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form form={interviewForm} layout="vertical" onFinish={handleScheduleInterview} style={{ marginTop: 16 }}>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div><strong>Ứng viên:</strong> {selectedApp?.candidate_name}</div>
            <div><strong>Vị trí:</strong> {selectedApp?.job_title}</div>
          </div>

          <Form.Item
            name="scheduled_at"
            label={<span style={{ fontWeight: 600 }}>Thời gian phỏng vấn</span>}
            rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item name="format" label={<span style={{ fontWeight: 600 }}>Hình thức phỏng vấn</span>}>
            <Radio.Group
              onChange={(e) => {
                const isOff = e.target.value === 'offline';
                if (isOff) {
                  const companyAddress = user?.company_address || user?.address || '';
                  interviewForm.setFieldsValue({ location: companyAddress });
                } else {
                  interviewForm.setFieldsValue({ location: '' });
                }
              }}
            >
              <Radio value="offline">Trực tiếp tại trụ sở</Radio>
              <Radio value="online">Trực tuyến (Google Meet / Zoom)</Radio>
            </Radio.Group>
          </Form.Item>

          {interviewFormat === 'online' ? (
            <Form.Item
              name="location"
              label={<span style={{ fontWeight: 600 }}>Đường dẫn cuộc họp trực tuyến (Google Meet / Zoom)</span>}
              rules={[{ required: true, message: 'Vui lòng cung cấp link họp trực tuyến' }]}
              extra="Link phòng họp online gửi tới sinh viên."
            >
              <Input placeholder="https://meet.google.com/abc-defg-hij" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          ) : (
            <Form.Item
              name="location"
              label={<span style={{ fontWeight: 600 }}>Địa chỉ phỏng vấn trực tiếp</span>}
              rules={[{ required: true, message: 'Vui lòng cung cấp địa chỉ trụ sở phỏng vấn' }]}
              extra="Đã tự động điền địa chỉ trụ sở công ty. Bạn có thể bổ sung số phòng họp cụ thể."
            >
              <Input placeholder="Tòa nhà FPT Cầu Giấy, Phố Duy Tân, Cầu Giấy, Hà Nội (Phòng họp 302)" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          )}

          <Form.Item name="note" label={<span style={{ fontWeight: 600 }}>Ghi chú chuẩn bị cho ứng viên</span>}>
            <TextArea rows={3} placeholder="Mang theo CV in, bản trình bày đồ án, bảng điểm..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setInterviewModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={scheduling} style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>
              Xác nhận và gửi lịch
            </Button>
          </div>
        </Form>
      </Modal>

      {/* CV View Modal */}
      <Modal
        open={cvModalOpen}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
            <span>Hồ sơ CV của ứng viên (Chuẩn TopCV)</span>
            {viewingCv && (
              <Button
                type="primary"
                onClick={() =>
                  downloadCVAsPDF(viewingCv, {
                    fullName: viewingCv.candidate_name,
                    title: viewingCv.cv_title,
                    email: viewingCv.candidate_email,
                    phone: viewingCv.candidate_phone,
                    university: viewingCv.university,
                    gpa: viewingCv.gpa,
                    cover_letter: viewingCv.cover_letter
                  })
                }
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, borderRadius: 8 }}
              >
                Tải CV (PDF)
              </Button>
            )}
          </div>
        }
        onCancel={() => setCvModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCvModalOpen(false)}>
            Đóng
          </Button>,
          viewingCv?.cv_file_url ? (
            <Button
              key="open-pdf"
              type="primary"
              onClick={() => openProtectedCvInNewTab(viewingCv.cv_file_url).catch((err) => message.error(err.message))}
              style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, borderRadius: 8 }}
            >
              Mở tệp PDF gốc của ứng viên
            </Button>
          ) : (
            <Button
              key="download"
              type="primary"
              onClick={() =>
                downloadCVAsPDF(viewingCv, {
                  fullName: viewingCv.candidate_name,
                  title: viewingCv.cv_title,
                  email: viewingCv.candidate_email,
                  phone: viewingCv.candidate_phone,
                  university: viewingCv.university,
                  gpa: viewingCv.gpa,
                  cover_letter: viewingCv.cover_letter
                })
              }
              style={{ background: '#059669', borderColor: '#059669', fontWeight: 700, borderRadius: 8 }}
            >
              Tải CV về máy (PDF Chuẩn TopCV)
            </Button>
          )
        ]}
        width={750}
      >
        {viewingCv && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 16, marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>
                {viewingCv.candidate_name}
              </Title>
              <div style={{ color: '#2563eb', fontWeight: 600 }}>{viewingCv.cv_title}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#64748b', marginTop: 8 }}>
                <span>Email: <b>{viewingCv.candidate_email}</b></span>
                <span>SĐT: <b>{viewingCv.candidate_phone}</b></span>
                <span>Trường: <b>{viewingCv.university}</b> (GPA: {viewingCv.gpa})</span>
              </div>
            </div>

            {viewingCv.cover_letter && (
              <div style={{ marginBottom: 16, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                <strong>Thư giới thiệu / Lời nhắn:</strong>
                <p style={{ marginTop: 6, whiteSpace: 'pre-line', color: '#334155' }}>
                  {viewingCv.cover_letter}
                </p>
              </div>
            )}

            {viewingCv.cv_file_url ? (
              <div style={{ marginTop: 14 }}>
                <iframe
                  src={cvBlobUrl || ''}
                  title="PDF Preview"
                  width="100%"
                  height="500px"
                  style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
                />
              </div>
            ) : (
              viewingCv.cv_content && (() => {
                let parsed = {};
                try {
                  parsed = typeof viewingCv.cv_content === 'object' ? viewingCv.cv_content : JSON.parse(viewingCv.cv_content);
                } catch {}

                return (
                  <div>
                    {parsed.objective && (
                      <div style={{ marginBottom: 14 }}>
                        <strong style={{ color: '#1e3a8a' }}>MỤC TIÊU NGHỀ NGHIỆP:</strong>
                        <p style={{ marginTop: 4, color: '#475569' }}>{parsed.objective}</p>
                      </div>
                    )}

                    {parsed.skills && (
                      <div style={{ marginBottom: 14 }}>
                        <strong style={{ color: '#1e3a8a' }}>KỸ NĂNG:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {parsed.skills.map((s, i) => (
                            <Tag key={i} color="blue">{s}</Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
