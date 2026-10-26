import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Select, Input, Button, message, Alert, Radio, Card } from 'antd';
import { SendOutlined, FileTextOutlined, CheckCircleFilled } from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;

export default function ApplyModal({ visible, job, onClose, onSuccess }) {
  const { isCandidate, user } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [cvs, setCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && isCandidate) {
      fetchCVs();
    }
  }, [visible, isCandidate]);

  const fetchCVs = async () => {
    setLoadingCvs(true);
    try {
      const res = await api.get('/candidates/cvs');
      if (res?.data) {
        setCvs(res.data);
        const defaultCv = res.data.find((c) => c.is_default);
        if (defaultCv) {
          form.setFieldsValue({ cv_id: defaultCv.id });
        } else if (res.data.length > 0) {
          form.setFieldsValue({ cv_id: res.data[0].id });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCvs(false);
    }
  };

  const handleFinish = async (values) => {
    if (!job?.id) return;
    setSubmitting(true);
    try {
      const res = await api.post('/applications', {
        job_id: job.id,
        cv_id: values.cv_id,
        cover_letter: values.cover_letter
      });
      message.success(res.message || 'Nộp hồ sơ ứng tuyển thành công!');
      form.resetFields();
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      message.error(err.message || 'Lỗi khi nộp hồ sơ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SendOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Nộp đơn ứng tuyển</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              {job?.title} - {job?.company_name}
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {!user ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Alert
            type="info"
            showIcon
            message="Yêu cầu đăng nhập"
            description="Bạn cần đăng nhập tài khoản Sinh viên (Ứng viên) để nộp hồ sơ ứng tuyển."
            style={{ marginBottom: 20 }}
          />
          <Button
            type="primary"
            onClick={() => {
              onClose();
              navigate('/login');
            }}
          >
            Đăng nhập để ứng tuyển
          </Button>
        </div>
      ) : !isCandidate ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Alert
            type="warning"
            showIcon
            message="Yêu cầu vai trò Sinh viên"
            description="Tài khoản hiện tại của bạn không phải vai trò Sinh viên (Ứng viên). Vui lòng đăng nhập bằng tài khoản Sinh viên để nộp hồ sơ."
            style={{ marginBottom: 20 }}
          />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            cover_letter: `Kính gửi Ban tuyển dụng ${job?.company_name},\nEm là ${user?.candidate_name || 'Phạm Huy Anh'}, sinh viên Trường Đại học Sư phạm Kỹ thuật Hưng Yên. Em rất quan tâm đến vị trí ${job?.title} và tin rằng các kỹ năng của mình sẽ đáp ứng tốt yêu cầu công việc. Rất mong có cơ hội trao đổi trực tiếp cùng Quý công ty.`
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="cv_id"
            label="Chọn CV ứng tuyển"
            rules={[{ required: true, message: 'Vui lòng chọn CV để ứng tuyển' }]}
          >
            {cvs.length === 0 ? (
              <Alert
                type="info"
                message="Bạn chưa có CV nào"
                description="Hệ thống đã chuẩn bị sẵn CV mẫu cho bạn trong mục Quản lý CV. Bạn có thể nhấn nộp và hệ thống sẽ tự động liên kết."
              />
            ) : (
              <Radio.Group style={{ width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cvs.map((cv) => (
                    <Card
                      key={cv.id}
                      size="small"
                      style={{
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer'
                      }}
                      bodyStyle={{ padding: 12 }}
                      onClick={() => form.setFieldsValue({ cv_id: cv.id })}
                    >
                      <Radio value={cv.id} style={{ width: '100%' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <FileTextOutlined style={{ color: cv.type === 'uploaded' ? '#059669' : '#2563eb', fontSize: 16 }} />
                          <span style={{ fontWeight: 600 }}>{cv.title}</span>
                          <span style={{ fontSize: 11, background: cv.type === 'uploaded' ? '#ecfdf5' : '#eff6ff', color: cv.type === 'uploaded' ? '#047857' : '#1d4ed8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            {cv.type === 'uploaded' ? 'Tệp PDF tải lên' : 'CV trực tuyến'}
                          </span>
                          {Boolean(cv.is_default) && (
                            <span style={{ fontSize: 11, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              Mặc định
                            </span>
                          )}
                        </div>
                      </Radio>
                    </Card>
                  ))}
                </div>
              </Radio.Group>
            )}
          </Form.Item>

          <Form.Item
            name="cover_letter"
            label="Thư giới thiệu / Lời nhắn tới nhà tuyển dụng"
            rules={[{ required: true, message: 'Vui lòng nhập lời nhắn' }]}
          >
            <TextArea
              rows={5}
              placeholder="Nêu ngắn gọn lý do bạn phù hợp với công việc và mục tiêu thực tập của bạn..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={submitting}
              style={{ background: '#2563eb' }}
            >
              Gửi hồ sơ ngay
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}
