import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Popconfirm,
  Typography,
  message,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import api from '../api/client';

const { Title, Text } = Typography;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    form.setFieldsValue({ name: cat.name });
    setModalOpen(true);
  };

  const handleFinish = async (values) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, values);
        message.success('Cập nhật ngành nghề thành công');
      } else {
        await api.post('/categories', values);
        message.success('Thêm mới ngành nghề thành công');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Đã xóa ngành nghề');
      fetchCategories();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Mã ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Tên ngành nghề / Danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Số lượng tin tuyển dụng đang mở',
      dataIndex: 'job_count',
      key: 'job_count',
      render: (count) => <Tag color="blue">{count || 0} tin tuyển dụng</Tag>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Popconfirm
            title="Xóa ngành nghề này?"
            description="Các tin thuộc ngành này sẽ chuyển về Chưa phân loại."
            onConfirm={() => handleDelete(record.id)}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Quản lý danh mục ngành nghề
            </Title>
            <Text type="secondary">
              Danh mục các lĩnh vực việc làm và thực tập trên hệ thống
            </Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{ borderRadius: 8, background: '#2563eb', fontWeight: 600 }}
          >
            Thêm ngành nghề mới
          </Button>
        </div>

        <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 20 }}>
          <Table
            columns={columns}
            dataSource={categories}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={editingCategory ? 'Chỉnh sửa ngành nghề' : 'Thêm mới ngành nghề'}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên ngành nghề"
            rules={[{ required: true, message: 'Vui lòng nhập tên ngành nghề' }]}
          >
            <Input placeholder="VD: Trí tuệ nhân tạo (AI), An toàn thông tin..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#2563eb' }}>
              {editingCategory ? 'Lưu thay đổi' : 'Thêm ngành nghề'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
