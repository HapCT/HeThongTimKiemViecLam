import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Space,
  Avatar,
  message,
  Popconfirm,
  Input,
  Modal,
  Descriptions,
  Spin,
  Alert
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../api/client';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  // Realtime Tax Modal
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [taxModalLoading, setTaxModalLoading] = useState(false);
  const [taxData, setTaxData] = useState(null);

  const checkLiveTax = async (taxCode, compName) => {
    if (!taxCode) {
      message.warning('Doanh nghiệp này chưa cập nhật Mã số thuế');
      return;
    }
    const clean = taxCode.trim().replace(/\s+/g, '');
    setTaxModalOpen(true);
    setTaxModalLoading(true);
    setTaxData(null);
    try {
      const resp = await fetch(`https://api.vietqr.io/v2/business/${clean}`);
      const resJson = await resp.json();
      if (resJson?.code === '00' && resJson?.data) {
        setTaxData({
          success: true,
          inputTax: taxCode,
          declaredName: compName,
          ...resJson.data
        });
      } else {
        setTaxData({
          success: false,
          inputTax: taxCode,
          declaredName: compName,
          error: resJson?.desc || 'Không tìm thấy dữ liệu mã số thuế trên cổng Cục Thuế Quốc Gia'
        });
      }
    } catch (e) {
      setTaxData({
        success: false,
        inputTax: taxCode,
        declaredName: compName,
        error: 'Lỗi kết nối máy chủ dữ liệu thuế'
      });
    } finally {
      setTaxModalLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, keyword]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (keyword) params.append('keyword', keyword);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res?.data) {
        setUsers(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const nextStatus = user.status === 'locked' ? 'active' : 'locked';
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: nextStatus });
      message.success(`Đã chuyển trạng thái tài khoản sang: ${nextStatus.toUpperCase()}`);
      fetchUsers();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: 'Tài khoản & Email',
      key: 'user',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar
            icon={record.role === 'company' ? <BankOutlined /> : <UserOutlined />}
            style={{
              background:
                record.role === 'admin'
                  ? '#ef4444'
                  : record.role === 'company'
                  ? '#0d9488'
                  : '#2563eb'
            }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              {record.candidate_name || record.company_name || 'Quản trị viên'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const conf = {
          candidate: { color: 'blue', text: 'Sinh viên' },
          company: { color: 'cyan', text: 'Doanh nghiệp' },
          admin: { color: 'red', text: 'Quản trị viên' }
        };
        return <Tag color={conf[role]?.color}>{conf[role]?.text || role}</Tag>;
      }
    },
    {
      title: 'Thông tin chi tiết',
      key: 'details',
      render: (_, record) => {
        if (record.role === 'candidate') {
          return (
            <div style={{ fontSize: 12, color: '#475569' }}>
              <div>Trường: {record.university || 'UTEHY'}</div>
              <div>Ngành: {record.major || 'KTPM'} • SĐT: {record.candidate_phone || '---'}</div>
            </div>
          );
        }
        if (record.role === 'company') {
          return (
            <div style={{ fontSize: 12, color: '#475569', lineHeight: '1.6' }}>
              <div>
                <strong>MST:</strong>{' '}
                {record.tax_code ? (
                  <Space size={6} wrap>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#0f172a' }}>
                      {record.tax_code}
                    </code>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => checkLiveTax(record.tax_code, record.company_name)}
                      style={{ padding: 0, height: 'auto', fontSize: 11, color: '#0d9488', fontWeight: 700 }}
                    >
                      Đối soát Realtime
                    </Button>
                    <a
                      href={`https://masothue.com/search?q=${record.tax_code}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 11, color: '#2563eb', textDecoration: 'underline' }}
                    >
                      Cổng QG
                    </a>
                  </Space>
                ) : (
                  <Tag color="warning" style={{ fontSize: 11, margin: 0 }}>Chưa có MST</Tag>
                )}
              </div>
              {record.website && (
                <div>
                  <strong>Website:</strong>{' '}
                  <a
                    href={record.website.startsWith('http') ? record.website : `https://${record.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284c7' }}
                  >
                    {record.website}
                  </a>
                </div>
              )}
              {record.address && <div><strong>Trụ sở:</strong> {record.address}</div>}
              {record.company_phone && <div><strong>SĐT:</strong> {record.company_phone}</div>}
            </div>
          );
        }
        return <span style={{ color: '#94a3b8' }}>Hệ thống</span>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'active' ? 'green' : 'red'} style={{ borderRadius: 6, fontWeight: 700 }}>
          {s === 'active' ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
        </Tag>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => new Date(d).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        if (record.role === 'admin') return null;
        const isLocked = record.status === 'locked';
        return (
          <Popconfirm
            title={isLocked ? 'Mở khóa tài khoản này?' : 'Khóa tài khoản này?'}
            description={
              isLocked
                ? 'Tài khoản sẽ được cấp quyền đăng nhập lại bình thường.'
                : 'Tài khoản bị khóa sẽ không thể đăng nhập vào hệ thống.'
            }
            onConfirm={() => toggleUserStatus(record)}
            okText="Đồng ý"
            cancelText="Hủy"
          >
            <Button
              size="small"
              danger={!isLocked}
              icon={isLocked ? <UnlockOutlined /> : <LockOutlined />}
            >
              {isLocked ? 'Mở khóa' : 'Khóa'}
            </Button>
          </Popconfirm>
        );
      }
    }
  ];

  const handleExportUsers = () => {
    if (users.length === 0) {
      message.warning('Không có dữ liệu người dùng để xuất');
      return;
    }
    const data = users.map((u, idx) => ({
      'STT': idx + 1,
      'Vai trò': u.role === 'admin' ? 'Quản trị viên' : u.role === 'company' ? 'Doanh nghiệp' : 'Sinh viên',
      'Tên người dùng / Đơn vị': u.role === 'company' ? u.company_name : u.candidate_name || 'Quản trị viên',
      'Email': u.email,
      'Số điện thoại': u.role === 'company' ? u.company_phone : u.candidate_phone || '',
      'Thông tin bổ sung': u.role === 'company' ? `MST: ${u.tax_code || '---'}` : `Trường: ${u.university || 'UTEHY'} - ${u.major || ''}`,
      'Trạng thái': u.status === 'active' ? 'Hoạt động' : 'Bị khóa',
      'Ngày tạo tài khoản': new Date(u.created_at).toLocaleDateString('vi-VN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'NguoiDung');
    XLSX.writeFile(workbook, `Danh_sach_tai_khoan_UTEHY_${new Date().toISOString().slice(0, 10)}.xlsx`);
    message.success('Xuất file Excel danh sách người dùng thành công!');
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 60px' }}>
      <div className="app-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
              Quản lý tài khoản người dùng
            </Title>
            <Text type="secondary">
              Xem danh sách và kiểm soát quyền truy cập của sinh viên & doanh nghiệp
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportUsers}
              style={{ color: '#059669', borderColor: '#059669', fontWeight: 600, height: 38, borderRadius: 8 }}
            >
              Xuất Excel
            </Button>

            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Tìm theo email hoặc tên..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220, borderRadius: 8 }}
              allowClear
            />

            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: 160 }}
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="candidate">Sinh viên</Option>
              <Option value="company">Doanh nghiệp</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </div>
        </div>

        <Card style={{ borderRadius: 16, border: '1px solid #e2e8f0' }} bodyStyle={{ padding: 20 }}>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>

        {/* Realtime Tax Verification Modal */}
        <Modal
          title="Kết quả Đối soát Mã số thuế với Cục Thuế Quốc Gia"
          open={taxModalOpen}
          onCancel={() => setTaxModalOpen(false)}
          footer={[
            <Button key="close" type="primary" onClick={() => setTaxModalOpen(false)}>
              Đóng
            </Button>
          ]}
          width={620}
        >
          {taxModalLoading ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 12, color: '#64748b' }}>Đang kết nối Cổng Dữ Liệu Thuế Quốc Gia...</div>
            </div>
          ) : taxData ? (
            taxData.success ? (
              <div style={{ paddingTop: 8 }}>
                <Alert
                  type="success"
                  showIcon
                  message="MÃ SỐ THUẾ HỢP LỆ & DOANH NGHIỆP ĐANG HOẠT ĐỘNG"
                  description="Doanh nghiệp này đã được đăng ký và hoạt động hợp pháp theo dữ liệu Cục Thuế Việt Nam."
                  style={{ marginBottom: 16 }}
                />
                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Mã số thuế">{taxData.id || taxData.inputTax}</Descriptions.Item>
                  <Descriptions.Item label="Tên pháp nhân (Thuế)"><strong>{taxData.name}</strong></Descriptions.Item>
                  <Descriptions.Item label="Tên khai báo">{taxData.declaredName}</Descriptions.Item>
                  <Descriptions.Item label="Tình trạng NNT">
                    <Tag color="green" style={{ fontWeight: 700 }}>{taxData.status || 'NNT đang hoạt động'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ trụ sở">{taxData.address}</Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <Alert
                  type="error"
                  showIcon
                  message="CẢNH BÁO: MÃ SỐ THUẾ KHÔNG HỢP LỆ"
                  description={taxData.error}
                  style={{ marginBottom: 16 }}
                />
                <Text type="secondary">
                  Mã số thuế khai báo: <strong>{taxData.inputTax}</strong> không tìm thấy trong cơ sở dữ liệu doanh nghiệp nhà nước hoặc đã bị đóng mã số thuế. Quản trị viên nên từ chối hoặc khóa tài khoản này.
                </Text>
              </div>
            )
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
