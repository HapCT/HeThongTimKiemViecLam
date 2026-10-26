import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Row,
  Col,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  Popconfirm,
  message,
  Divider,
  Alert,
  Upload,
  Checkbox
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarFilled,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  ProjectOutlined,
  TrophyOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
  EditOutlined
} from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { downloadCVAsPDF } from '../utils/cvExporter';
import { fetchProtectedCvBlobUrl, openProtectedCvInNewTab } from '../api/fileHelper';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CandidateCVPage() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCV, setEditingCV] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewCV, setPreviewCV] = useState(null);
  const [cvBlobUrl, setCvBlobUrl] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchCVs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/candidates/cvs');
      if (res?.data) {
        setCvs(res.data);
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || 'Không thể tải danh sách CV, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, []);

  useEffect(() => {
    let active = true;
    let blobUrl = null;
    if (previewCV?.file_url) {
      fetchProtectedCvBlobUrl(previewCV.file_url)
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
  }, [previewCV]);
  
  // Upload CV states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadIsDefault, setUploadIsDefault] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSetDefault = async (cvId) => {
    try {
      await api.patch(`/candidates/cvs/${cvId}/default`);
      message.success('Đã chọn làm CV mặc định');
      fetchCVs();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (cvId) => {
    try {
      await api.delete(`/candidates/cvs/${cvId}`);
      message.success('Đã xóa CV thành công');
      fetchCVs();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCreateCV = async (values) => {
    setSubmitting(true);
    try {
      const cvContent = {
        fullName: values.fullName || user?.candidate_name || user?.full_name || 'Ứng viên',
        email: values.email || user?.email,
        phone: values.phone || user?.phone || '',
        objective: values.objective,
        education: [
          {
            school: values.school || user?.university || 'Trường Đại học',
            major: values.major || user?.major || '',
            gpa: values.gpa || (user?.gpa ? String(user.gpa) : '')
          }
        ],
        skills: values.skills ? values.skills.split(',').map((s) => s.trim()) : [],
        projects: [
          {
            name: values.projectName || 'Dự án thực tế',
            role: 'Developer',
            tech: values.projectTech || ''
          }
        ]
      };

      await api.post('/candidates/cvs', {
        title: values.title,
        type: 'created',
        content: cvContent,
        is_default: values.is_default ? 1 : 0
      });

      message.success('Tạo CV mới thành công');
      setCreateModalOpen(false);
      form.resetFields();
      fetchCVs();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (cv) => {
    setEditingCV(cv);
    let content = {};
    if (typeof cv.content === 'object' && cv.content !== null) {
      content = cv.content;
    } else if (typeof cv.content === 'string') {
      try {
        content = JSON.parse(cv.content);
      } catch (e) {
        content = {};
      }
    }

    editForm.setFieldsValue({
      title: cv.title,
      fullName: content.fullName || user?.candidate_name || user?.full_name || '',
      email: content.email || user?.email || '',
      phone: content.phone || user?.phone || '',
      objective: content.objective || '',
      school: content.education?.[0]?.school || user?.university || '',
      major: content.education?.[0]?.major || user?.major || '',
      gpa: content.education?.[0]?.gpa || (user?.gpa ? String(user.gpa) : ''),
      skills: Array.isArray(content.skills) ? content.skills.join(', ') : '',
      projectName: content.projects?.[0]?.name || '',
      projectTech: content.projects?.[0]?.tech || '',
      is_default: Boolean(cv.is_default)
    });
    setEditModalOpen(true);
  };

  const handleUpdateCV = async (values) => {
    if (!editingCV) return;
    setUpdating(true);
    try {
      const cvContent = {
        fullName: values.fullName || user?.candidate_name || user?.full_name || 'Ứng viên',
        email: values.email || user?.email,
        phone: values.phone || user?.phone || '',
        objective: values.objective,
        education: [
          {
            school: values.school || user?.university || 'Trường Đại học',
            major: values.major || user?.major || '',
            gpa: values.gpa || ''
          }
        ],
        skills: values.skills ? values.skills.split(',').map((s) => s.trim()) : [],
        projects: [
          {
            name: values.projectName || 'Dự án thực tế',
            role: 'Developer',
            tech: values.projectTech || ''
          }
        ]
      };

      await api.put(`/candidates/cvs/${editingCV.id}`, {
        title: values.title,
        content: cvContent,
        is_default: values.is_default ? 1 : 0
      });

      message.success('Cập nhật CV thành công!');
      setEditModalOpen(false);
      setEditingCV(null);
      editForm.resetFields();
      fetchCVs();
    } catch (err) {
      message.error(err.message || 'Lỗi khi cập nhật CV');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadCV = async () => {
    if (!uploadFile) {
      message.warning('Vui lòng chọn tệp CV (PDF/Word)');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle.trim() || uploadFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('is_default', uploadIsDefault ? '1' : '0');

      await api.post('/candidates/cvs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      message.success('Tải lên tệp CV thành công!');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadIsDefault(false);
      fetchCVs();
    } catch (err) {
      message.error(err.message || 'Lỗi khi tải lên CV');
    } finally {
      setUploading(false);
    }
  };

  const parseCVContent = (cv) => {
    if (!cv?.content) return {};
    if (typeof cv.content === 'object') return cv.content;
    try {
      return JSON.parse(cv.content);
    } catch (e) {
      return {};
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Quản lý CV ứng tuyển
            </Title>
            <Text type="secondary">
              Tạo và quản lý các hồ sơ CV chuyên nghiệp để ứng tuyển nhanh vào các doanh nghiệp
            </Text>
          </div>

          <Space wrap>
            <Button
              icon={<UploadOutlined />}
              onClick={() => setUploadModalOpen(true)}
              style={{ borderRadius: 8, height: 40, fontWeight: 600, borderColor: '#2563eb', color: '#2563eb' }}
            >
              Tải lên CV (PDF/Word)
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{ borderRadius: 8, background: '#2563eb', fontWeight: 600, height: 40 }}
            >
              Tạo CV trực tuyến
            </Button>
          </Space>
        </div>

        {/* CV Grid */}
        <Row gutter={[20, 20]}>
          {cvs.map((cv) => {
            const isUploaded = cv.type === 'uploaded';
            const content = !isUploaded ? parseCVContent(cv) : {};
            return (
              <Col xs={24} md={12} key={cv.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 16,
                    border: cv.is_default ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    background: '#ffffff',
                    position: 'relative'
                  }}
                  bodyStyle={{ padding: 24 }}
                >
                  {Boolean(cv.is_default) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      CV Mặc định
                    </div>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    {isUploaded ? (
                      <Tag color="green" icon={<FilePdfOutlined />} style={{ marginBottom: 8, padding: '3px 8px', fontWeight: 600 }}>
                        Tệp CV đã tải lên (PDF/Word)
                      </Tag>
                    ) : (
                      <Tag color="blue" icon={<FileTextOutlined />} style={{ marginBottom: 8, padding: '3px 8px', fontWeight: 600 }}>
                        CV tạo trực tuyến (JSON)
                      </Tag>
                    )}
                    <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                      {cv.title}
                    </Title>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Cập nhật lúc: {new Date(cv.updated_at || cv.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  {isUploaded ? (
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 18, border: '1px dashed #cbd5e1' }}>
                      <Text style={{ fontSize: 13, color: '#334155' }}>
                        📎 Tệp đính kèm:{' '}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            openProtectedCvInNewTab(cv.file_url).catch((err) => message.error(err.message));
                          }}
                          style={{ fontWeight: 600, color: '#2563eb' }}
                        >
                          {cv.file_url ? cv.file_url.split('/').pop() : 'Xem file CV'}
                        </a>
                      </Text>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Định dạng sẵn sàng để nộp hồ sơ trực tiếp tới nhà tuyển dụng.
                      </div>
                    </div>
                  ) : (
                    <>
                      {content.objective && (
                        <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#475569', fontSize: 13, marginBottom: 14 }}>
                          "{content.objective}"
                        </Paragraph>
                      )}

                      {content.skills && content.skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                          {content.skills.slice(0, 5).map((skill, idx) => (
                            <Tag key={idx} color="blue" style={{ borderRadius: 4, fontSize: 11 }}>
                              {skill}
                            </Tag>
                          ))}
                          {content.skills.length > 5 && (
                            <Tag style={{ borderRadius: 4, fontSize: 11 }}>+{content.skills.length - 5}</Tag>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Space wrap>
                      <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewCV(cv)}
                      >
                        Xem chi tiết
                      </Button>

                      {isUploaded ? (
                        <Button
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => openProtectedCvInNewTab(cv.file_url).catch((err) => message.error(err.message))}
                          style={{
                            background: '#059669',
                            borderColor: '#059669',
                            fontWeight: 600,
                            borderRadius: 6
                          }}
                        >
                          Mở tệp PDF
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() =>
                            downloadCVAsPDF(cv, {
                              fullName: user?.candidate_name || user?.full_name,
                              email: user?.email,
                              phone: user?.phone
                            })
                          }
                          style={{
                            background: '#059669',
                            borderColor: '#059669',
                            fontWeight: 600,
                            borderRadius: 6
                          }}
                        >
                          Tải về PDF
                        </Button>
                      )}

                      {!isUploaded && (
                        <Button
                          type="default"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(cv)}
                          style={{ borderColor: '#2563eb', color: '#2563eb' }}
                        >
                          Sửa
                        </Button>
                      )}

                      {!cv.is_default && (
                        <Button
                          type="link"
                          size="small"
                          onClick={() => handleSetDefault(cv.id)}
                        >
                          Đặt làm mặc định
                        </Button>
                      )}
                    </Space>

                    <Popconfirm
                      title="Xóa CV này?"
                      description="Hành động này không thể hoàn tác nếu CV chưa được dùng để ứng tuyển."
                      onConfirm={() => handleDelete(cv.id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Create CV Modal */}
      <Modal
        open={createModalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#2563eb' }} />
            <span>Tạo CV trực tuyến mới</span>
          </div>
        }
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCV}
          initialValues={{
            fullName: user?.candidate_name || user?.full_name || '',
            email: user?.email,
            phone: user?.phone || '',
            school: user?.university || 'Trường Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
            major: user?.major || 'Công nghệ thông tin',
            gpa: user?.gpa ? String(user.gpa) : '3.5',
            skills: 'JavaScript, TypeScript, React.js, Node.js, MySQL, Git',
            projectName: 'Dự án thực tập tốt nghiệp',
            projectTech: 'React, Node.js, MySQL',
            is_default: true
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề CV"
            rules={[{ required: true, message: 'Vui lòng nhập tên CV' }]}
          >
            <Input placeholder="VD: CV Lập trình viên Fullstack Developer" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="Họ tên hiển thị">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="objective"
            label="Mục tiêu nghề nghiệp"
            rules={[{ required: true, message: 'Vui lòng nhập mục tiêu' }]}
            initialValue="Mong muốn tìm kiếm cơ hội thực tập vị trí Lập trình viên để áp dụng kiến thức Kỹ thuật phần mềm vào dự án doanh nghiệp thực tế."
          >
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="school" label="Trường đào tạo">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="major" label="Ngành học">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="gpa" label="GPA">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="skills" label="Kỹ năng chuyên môn (cách nhau bởi dấu phẩy)">
            <Input placeholder="HTML, CSS, React, Node.js, MySQL..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectName" label="Dự án tiêu biểu">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="projectTech" label="Công nghệ sử dụng">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setCreateModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#2563eb' }}>
              Tạo CV ngay
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit CV Modal */}
      <Modal
        open={editModalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#2563eb' }} />
            <span>Chỉnh sửa CV trực tuyến</span>
          </div>
        }
        onCancel={() => {
          setEditModalOpen(false);
          setEditingCV(null);
        }}
        footer={null}
        width={680}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateCV}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="title"
            label="Tiêu đề CV"
            rules={[{ required: true, message: 'Vui lòng nhập tên CV' }]}
          >
            <Input placeholder="VD: CV Lập trình viên Fullstack Developer" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullName" label="Họ tên hiển thị">
                <Input placeholder="Họ và tên..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại">
                <Input placeholder="Số điện thoại liên hệ..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="objective"
            label="Mục tiêu nghề nghiệp"
            rules={[{ required: true, message: 'Vui lòng nhập mục tiêu' }]}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="school" label="Trường học">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="major" label="Chuyên ngành">
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="gpa" label="GPA">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="skills" label="Kỹ năng chuyên môn (cách nhau bởi dấu phẩy)">
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectName" label="Tên dự án nổi bật">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="projectTech" label="Công nghệ sử dụng">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_default" valuePropName="checked">
            <Checkbox>Đặt làm CV mặc định</Checkbox>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={() => { setEditModalOpen(false); setEditingCV(null); }}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={updating} style={{ background: '#2563eb' }}>
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>

      {/* CV Preview Modal */}
      <Modal
        open={Boolean(previewCV)}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#1e3a8a' }}>Xem trước CV hoàn chỉnh (Chuẩn TopCV)</span>
            {previewCV && (
              <Button
                type="primary"
                onClick={() =>
                  downloadCVAsPDF(previewCV, {
                    fullName: user?.candidate_name || user?.full_name,
                    email: user?.email,
                    phone: user?.phone
                  })
                }
                style={{
                  background: '#059669',
                  borderColor: '#059669',
                  fontWeight: 700,
                  borderRadius: 8
                }}
              >
                Tải CV về máy (PDF)
              </Button>
            )}
          </div>
        }
        onCancel={() => setPreviewCV(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewCV(null)}>
            Đóng
          </Button>,
          previewCV && (
            <Button
              key="download"
              type="primary"
              onClick={() =>
                downloadCVAsPDF(previewCV, {
                  fullName: user?.candidate_name || user?.full_name,
                  email: user?.email,
                  phone: user?.phone
                })
              }
              style={{
                background: '#059669',
                borderColor: '#059669',
                fontWeight: 700,
                borderRadius: 8
              }}
            >
              Tải CV về máy (PDF Chuẩn TopCV)
            </Button>
          )
        ]}
        width={820}
        styles={{ body: { padding: '16px 28px 28px' } }}
      >
        {previewCV && previewCV.type === 'uploaded' ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <Alert
              type="success"
              showIcon
              message={`Tệp CV tải lên: ${previewCV.title}`}
              description="Hệ thống đã lưu tệp CV của bạn sẵn sàng để ứng tuyển trực tiếp tới doanh nghiệp."
              style={{ marginBottom: 16, textAlign: 'left', borderRadius: 8 }}
            />
            <iframe
              src={cvBlobUrl || ''}
              title="Preview CV"
              width="100%"
              height="550px"
              style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}
            />
            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => openProtectedCvInNewTab(previewCV.file_url).catch((err) => message.error(err.message))}
                style={{ background: '#2563eb' }}
              >
                Mở tệp PDF trong tab mới
              </Button>
            </div>
          </div>
        ) : (
          previewCV && (() => {
            const content = parseCVContent(previewCV);
            return (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 32,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                {/* CV Header */}
                <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 20, marginBottom: 20 }}>
                  <Title level={3} style={{ margin: 0, color: '#1e3a8a', textTransform: 'uppercase' }}>
                    {content.fullName || 'PHẠM HUY ANH'}
                  </Title>
                  <div style={{ fontSize: 15, color: '#2563eb', fontWeight: 600, marginTop: 4 }}>
                    {previewCV.title}
                  </div>
                  <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 13, color: '#475569', flexWrap: 'wrap' }}>
                    <span>Email: <b>{content.email || user?.email}</b></span>
                    <span>SĐT: <b>{content.phone || user?.phone}</b></span>
                  </div>
                </div>

                {/* Objective */}
                {content.objective && (
                  <div style={{ marginBottom: 20 }}>
                    <Title level={5} style={{ color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 6 }}>
                      Mục tiêu nghề nghiệp
                    </Title>
                    <Paragraph style={{ color: '#334155', lineHeight: 1.7, fontSize: 14 }}>
                      "{content.objective}"
                    </Paragraph>
                  </div>
                )}

                {/* Education */}
                {content.education && (
                  <div style={{ marginBottom: 20 }}>
                    <Title level={5} style={{ color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 8 }}>
                      Học vấn & Bằng cấp
                    </Title>
                    {content.education.map((edu, idx) => (
                      <div key={idx} style={{ marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{edu.school}</div>
                        <div style={{ color: '#475569', fontSize: 13 }}>
                          Chuyên ngành: {edu.major} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {content.skills && content.skills.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <Title level={5} style={{ color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 8 }}>
                      Kỹ năng chuyên môn
                    </Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {content.skills.map((s, idx) => (
                        <Tag key={idx} color="blue" style={{ borderRadius: 4, padding: '4px 10px', fontSize: 13 }}>
                          {s}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {content.projects && (
                  <div>
                    <Title level={5} style={{ color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 8 }}>
                      Dự án tiêu biểu
                    </Title>
                    {content.projects.map((proj, idx) => (
                      <div key={idx} style={{ marginBottom: 10, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{proj.name}</div>
                        <div style={{ color: '#64748b', fontSize: 13 }}>
                          Vai trò: {proj.role} • Công nghệ: <span style={{ color: '#2563eb' }}>{proj.tech}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </Modal>

      {/* Upload CV Modal */}
      <Modal
        open={uploadModalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UploadOutlined style={{ color: '#2563eb' }} />
            <span>Tải lên CV có sẵn (PDF / Word)</span>
          </div>
        }
        onCancel={() => setUploadModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalOpen(false)}>Hủy</Button>,
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={handleUploadCV}
            style={{ background: '#2563eb' }}
          >
            Tải lên ngay
          </Button>
        ]}
      >
        <div style={{ padding: '10px 0' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Tên / Tiêu đề hồ sơ CV:</Text>
            <Input
              placeholder="Ví dụ: CV Frontend Developer"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>Chọn tệp từ máy tính (PDF, DOC, DOCX - tối đa 15MB):</Text>
            <div style={{ marginTop: 8 }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadFile(e.target.files[0]);
                    if (!uploadTitle) {
                      setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  }
                }}
                style={{ width: '100%', padding: '8px', border: '1px dashed #cbd5e1', borderRadius: 6 }}
              />
            </div>
            {uploadFile && (
              <div style={{ marginTop: 8, color: '#059669', fontSize: 13, fontWeight: 600 }}>
                ✓ Đã chọn: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <div>
            <Checkbox
              checked={uploadIsDefault}
              onChange={(e) => setUploadIsDefault(e.target.checked)}
            >
              Đặt làm CV mặc định khi ứng tuyển việc làm
            </Checkbox>
          </div>
        </div>
      </Modal>
    </div>
  );
}
