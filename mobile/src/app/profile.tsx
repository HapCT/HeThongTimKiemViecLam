import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getSavedJobs, getMyCVs } from '../services/api';

export default function ProfileScreen() {
  const { user, login, register, logout, loading } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [major, setMajor] = useState('Công nghệ thông tin');
  const [submitting, setSubmitting] = useState(false);

  // Saved Jobs Modal
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // CVs Modal
  const [cvModalVisible, setCvModalVisible] = useState(false);
  const [myCVs, setMyCVs] = useState<any[]>([]);
  const [loadingCVs, setLoadingCVs] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password.trim());
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Không thể đăng nhập', result.error || 'Đăng nhập thất bại');
    } else {
      Alert.alert('Chào mừng 🎉', 'Đăng nhập tài khoản Ứng viên thành công!');
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền Họ tên, Email và Mật khẩu');
      return;
    }

    setSubmitting(true);
    const result = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim(),
      phone: phone.trim(),
      major: major.trim() || 'Công nghệ thông tin',
      university: 'ĐH Sư phạm Kỹ thuật Hưng Yên (UTEHY)',
    });
    setSubmitting(false);

    if (!result.success) {
      Alert.alert('Không thể đăng ký', result.error || 'Đăng ký thất bại');
    } else {
      Alert.alert('Chúc mừng 🎉', 'Đăng ký tài khoản Sinh viên thành công và đã tự động đăng nhập!');
    }
  };

  const openSavedJobs = async () => {
    setSavedModalVisible(true);
    setLoadingSaved(true);
    try {
      const data = await getSavedJobs();
      setSavedJobs(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách việc làm đã lưu');
    } finally {
      setLoadingSaved(false);
    }
  };

  const openCVs = async () => {
    setCvModalVisible(true);
    setLoadingCVs(true);
    try {
      const data = await getMyCVs();
      setMyCVs(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách CV');
    } finally {
      setLoadingCVs(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ Ứng viên 🎓</Text>
        <Text style={styles.headerSubtitle}>
          Đại học Sư phạm Kỹ thuật Hưng Yên (UTEHY)
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ================= NẾU CHƯA ĐĂNG NHẬP ================= */}
        {!user ? (
          <View style={styles.loginCard}>
            {/* Toggle Switcher */}
            <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: !isRegisterMode ? '#ffffff' : 'transparent', borderRadius: 8 }}
                onPress={() => setIsRegisterMode(false)}
              >
                <Text style={{ fontWeight: '700', color: !isRegisterMode ? '#2563eb' : '#64748b' }}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: isRegisterMode ? '#ffffff' : 'transparent', borderRadius: 8 }}
                onPress={() => setIsRegisterMode(true)}
              >
                <Text style={{ fontWeight: '700', color: isRegisterMode ? '#2563eb' : '#64748b' }}>Đăng ký mới</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardHeading}>{isRegisterMode ? 'Đăng ký tài khoản Sinh viên' : 'Đăng nhập Ứng viên'}</Text>
            <Text style={styles.cardSub}>
              {isRegisterMode ? 'Tạo tài khoản để nộp CV và ứng tuyển việc làm thực tập' : 'Nhập tài khoản để nộp hồ sơ và theo dõi lịch phỏng vấn'}
            </Text>

            {isRegisterMode && (
              <>
                <Text style={styles.inputLabel}>Họ và tên sinh viên:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  placeholderTextColor="#94a3b8"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Email sinh viên:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập địa chỉ email..."
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Mật khẩu:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mật khẩu..."
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {isRegisterMode && (
              <>
                <Text style={styles.inputLabel}>Số điện thoại:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0987654321..."
                  placeholderTextColor="#94a3b8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Chuyên ngành học:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Công nghệ thông tin..."
                  placeholderTextColor="#94a3b8"
                  value={major}
                  onChangeText={setMajor}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={isRegisterMode ? handleRegister : handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập'}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= NẾU ĐÃ ĐĂNG NHẬP ================= */
          <View>
            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>

              <Text style={styles.userName}>{user.full_name || 'Phạm Huy Anh'}</Text>
              <Text style={styles.userRole}>🎓 Ứng viên UTEHY</Text>

              <View style={styles.divider} />

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Mã SV / Lớp:</Text>
                <Text style={styles.fieldValue}>12523003 · 12523W.4</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Trường Đào tạo:</Text>
                <Text style={styles.fieldValue}>
                  {user.university || 'ĐH Sư phạm Kỹ thuật Hưng Yên'}
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Chuyên ngành:</Text>
                <Text style={styles.fieldValue}>{user.major || 'Công nghệ thông tin'}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Điểm GPA tích lũy:</Text>
                <Text style={[styles.fieldValue, { color: '#059669', fontWeight: '800' }]}>
                  {user.gpa || '3.65'} / 4.0 (Xuất sắc)
                </Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Email liên hệ:</Text>
                <Text style={styles.fieldValue}>{user.email}</Text>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Số điện thoại:</Text>
                <Text style={styles.fieldValue}>{user.phone || '0396830322'}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={openSavedJobs}
              >
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#0f172a' }}>⭐ Việc làm đã lưu yêu thích</Text>
                <Text style={{ color: '#2563eb', fontWeight: '700' }}>Xem →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                onPress={openCVs}
              >
                <Text style={{ fontWeight: '700', fontSize: 14, color: '#0f172a' }}>📄 Danh sách hồ sơ CV của tôi</Text>
                <Text style={{ color: '#2563eb', fontWeight: '700' }}>Xem →</Text>
              </TouchableOpacity>
            </View>

            {/* Nút Đăng xuất */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Saved Jobs Modal */}
      <Modal visible={savedModalVisible} animationType="slide" onRequestClose={() => setSavedModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800' }}>Việc làm đã lưu ⭐</Text>
            <TouchableOpacity onPress={() => setSavedModalVisible(false)} style={{ padding: 6 }}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
          {loadingSaved ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : savedJobs.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#64748b' }}>Bạn chưa lưu tin việc làm nào.</Text>
            </View>
          ) : (
            <FlatList
              data={savedJobs}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: '#0f172a' }}>{item.title}</Text>
                  <Text style={{ color: '#2563eb', fontWeight: '600', marginTop: 4 }}>{item.company_name}</Text>
                  <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>📍 {item.location} • 💼 {item.job_type === 'internship' ? 'Thực tập sinh' : 'Toàn thời gian'}</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* CVs List Modal */}
      <Modal visible={cvModalVisible} animationType="slide" onRequestClose={() => setCvModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={{ padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800' }}>Hồ sơ CV của tôi 📄</Text>
            <TouchableOpacity onPress={() => setCvModalVisible(false)} style={{ padding: 6 }}>
              <Text style={{ color: '#2563eb', fontWeight: '700' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
          {loadingCVs ? (
            <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
          ) : myCVs.length === 0 ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <Text style={{ color: '#64748b' }}>Chưa có CV nào. Bạn có thể tạo CV trên cổng Web Portal.</Text>
            </View>
          ) : (
            <FlatList
              data={myCVs}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: item.is_default ? '#3b82f6' : '#e2e8f0' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontWeight: '800', fontSize: 16, color: '#0f172a' }}>{item.title}</Text>
                    {Boolean(item.is_default) && (
                      <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                        <Text style={{ color: '#1d4ed8', fontSize: 11, fontWeight: '700' }}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                    Định dạng: {item.type === 'uploaded' ? 'Tệp PDF tải lên' : 'CV trực tuyến'}
                  </Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 14,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  userRole: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 7,
  },
  fieldLabel: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '800',
  },
});
