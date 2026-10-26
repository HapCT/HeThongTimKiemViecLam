import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getJobs, getCategories, applyJob, getMyCVs, toggleSaveJob, getSavedJobs, getJobById } from '../services/api';

export default function HomeScreen() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());

  // Job Detail Modal
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Apply Modal
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [coverLetter, setCoverLetter] = useState('Em chào quý công ty, em mong muốn ứng tuyển vị trí thực tập này để học hỏi và đóng góp cho dự án.');
  const [applying, setApplying] = useState(false);
  const [myCVs, setMyCVs] = useState<any[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadJobs();
  }, [selectedCatId, selectedType, selectedLocation]);

  useEffect(() => {
    if (user) {
      loadSavedJobs();
    } else {
      setSavedJobIds(new Set());
    }
  }, [user]);

  const loadSavedJobs = async () => {
    try {
      const list = await getSavedJobs();
      if (Array.isArray(list)) {
        setSavedJobIds(new Set(list.map((j: any) => j.id)));
      }
    } catch (err) {
      console.warn('Không thể tải việc làm đã lưu:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.warn('Không thể tải danh mục:', err);
    }
  };

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getJobs({
        keyword: keyword.trim() || undefined,
        category_id: selectedCatId || undefined,
        job_type: selectedType || undefined,
        location: selectedLocation || undefined,
      });
      setJobs(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách việc làm');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleSave = async (jobId: number) => {
    if (!user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản Ứng viên để lưu việc làm yêu thích.'
      );
      return;
    }
    try {
      const res = await toggleSaveJob(jobId);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (next.has(jobId)) {
          next.delete(jobId);
        } else {
          next.add(jobId);
        }
        return next;
      });
      Alert.alert('Thông báo', res?.message || 'Cập nhật việc làm đã lưu thành công');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể thao tác lưu việc làm');
    }
  };

  const handleSearch = () => {
    loadJobs();
  };

  const openDetail = async (job: any) => {
    setSelectedJob(job);
    setDetailModalVisible(true);
    try {
      const data = await getJobById(job.id);
      if (data) {
        setSelectedJob(data);
      }
    } catch (e) {
      console.error('Error fetching job details:', e);
    }
  };

  const openApply = async () => {
    if (!user) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập tài khoản Ứng viên ở mục "Ứng viên" trước khi nộp hồ sơ ứng tuyển.'
      );
      return;
    }
    try {
      const cvs = await getMyCVs();
      setMyCVs(cvs);
      setDetailModalVisible(false);
      setApplyModalVisible(true);
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể lấy thông tin CV của bạn');
    }
  };

  const handleConfirmApply = async () => {
    if (!selectedJob) return;
    if (myCVs.length === 0) {
      Alert.alert('Chưa có CV', 'Hệ thống chưa tìm thấy CV của bạn. Vui lòng tạo CV trên phiên bản Web trước.');
      return;
    }

    const defaultCV = myCVs.find((c) => c.is_default) || myCVs[0];

    setApplying(true);
    try {
      await applyJob(selectedJob.id, defaultCV.id, coverLetter);
      Alert.alert('Thành công 🎉', 'Đã nộp hồ sơ ứng tuyển thành công! Doanh nghiệp sẽ sớm phản hồi cho bạn.');
      setApplyModalVisible(false);
      loadJobs();
    } catch (err: any) {
      Alert.alert('Thông báo', err.message || 'Nộp hồ sơ thất bại');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min?: number, max?: number, neg?: number) => {
    if (neg) return 'Thỏa thuận';
    if (!min && !max) return 'Thỏa thuận';
    if (min && max) return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
    if (min) return `Từ ${(min / 1000000).toFixed(0)} triệu`;
    if (max) return `Đến ${(max / 1000000).toFixed(0)} triệu`;
    return 'Thỏa thuận';
  };

  const renderJobCard = ({ item }: { item: any }) => {
    const isSaved = savedJobIds.has(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => openDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.companyAvatar}>
            <Text style={styles.companyAvatarText}>
              {item.company_name ? item.company_name.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.company_name}
            </Text>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleToggleSave(item.id)}
            style={{ padding: 6 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 22, color: isSaved ? '#f59e0b' : '#cbd5e1' }}>
              {isSaved ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tagRow}>
          <View style={styles.tagBadgeSalary}>
            <Text style={styles.tagBadgeSalaryText}>
              💰 {formatSalary(item.salary_min, item.salary_max, item.salary_negotiable)}
            </Text>
          </View>
          <View style={styles.tagBadge}>
            <Text style={styles.tagBadgeText}>📍 {item.location || 'Hà Nội'}</Text>
          </View>
          <View style={styles.tagBadgeType}>
            <Text style={styles.tagBadgeTypeText}>
              {item.job_type === 'internship' ? '🎓 Thực tập' : '💼 Toàn thời gian'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.categoryText}>📁 {item.category_name || 'CNTT'}</Text>
          <Text style={styles.viewDetailText}>Xem chi tiết →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>JobUTEHY 🎓</Text>
          <Text style={styles.subLogoText}>Cổng Thực Tập & Việc Làm Ứng Viên</Text>
        </View>
        {user ? (
          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>Ứng viên: {user.full_name || 'Ứng viên'}</Text>
          </View>
        ) : (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>UTEHY</Text>
          </View>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm vị trí, ngôn ngữ, công ty..."
            placeholderTextColor="#94a3b8"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => { setKeyword(''); loadJobs(); }}>
              <Text style={{ fontSize: 14, color: '#94a3b8' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[styles.chip, selectedCatId === '' && styles.chipActive]}
            onPress={() => setSelectedCatId('')}
          >
            <Text style={[styles.chipText, selectedCatId === '' && styles.chipTextActive]}>
              Tất cả ngành
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCatId === cat.id && styles.chipActive]}
              onPress={() => setSelectedCatId(selectedCatId === cat.id ? '' : cat.id)}
            >
              <Text style={[styles.chipText, selectedCatId === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Job Type Chips */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 }}>
        <TouchableOpacity
          style={[styles.smallChip, selectedType === '' && styles.smallChipActive]}
          onPress={() => setSelectedType('')}
        >
          <Text style={[styles.smallChipText, selectedType === '' && styles.smallChipTextActive]}>Tất cả loại hình</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallChip, selectedType === 'internship' && styles.smallChipActive]}
          onPress={() => setSelectedType(selectedType === 'internship' ? '' : 'internship')}
        >
          <Text style={[styles.smallChipText, selectedType === 'internship' && styles.smallChipTextActive]}>🎓 Thực tập</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallChip, selectedType === 'full_time' && styles.smallChipActive]}
          onPress={() => setSelectedType(selectedType === 'full_time' ? '' : 'full_time')}
        >
          <Text style={[styles.smallChipText, selectedType === 'full_time' && styles.smallChipTextActive]}>💼 Toàn thời gian</Text>
        </TouchableOpacity>
      </View>

      {/* Location Filter Chips */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          {[
            { label: '📍 Tất cả địa điểm', val: '' },
            { label: 'Hà Nội', val: 'Hà Nội' },
            { label: 'Hưng Yên', val: 'Hưng Yên' },
            { label: 'Hồ Chí Minh', val: 'Hồ Chí Minh' },
            { label: 'Đà Nẵng', val: 'Đà Nẵng' },
            { label: 'Bắc Ninh', val: 'Bắc Ninh' },
            { label: 'Hải Phòng', val: 'Hải Phòng' },
          ].map((loc) => {
            const isActive = selectedLocation === loc.val;
            return (
              <TouchableOpacity
                key={loc.val}
                style={[
                  styles.smallChip,
                  isActive && { backgroundColor: '#ffedd5', borderColor: '#fdba74', borderWidth: 1 },
                ]}
                onPress={() => setSelectedLocation(selectedLocation === loc.val ? '' : loc.val)}
              >
                <Text
                  style={[
                    styles.smallChipText,
                    isActive && { color: '#c2410c', fontWeight: '700' },
                  ]}
                >
                  {loc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Đang tải tin tuyển dụng...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderJobCard}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadJobs();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy việc làm phù hợp</Text>
              <Text style={styles.emptyDesc}>Hãy thử thay đổi từ khóa hoặc bộ lọc ngành nghề nhé.</Text>
            </View>
          }
        />
      )}

      {/* ================= MODAL CHI TIẾT CÔNG VIỆC ================= */}
      <Modal visible={detailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedJob?.title}
              </Text>
              <TouchableOpacity onPress={() => { setDetailModalVisible(false); loadJobs(); }} style={styles.closeBtn}>
                <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <View style={styles.companyBox}>
                <Text style={styles.modalCompanyName}>{selectedJob?.company_name}</Text>
                <Text style={styles.modalCompanyAddress}>🏢 {selectedJob?.company_address || selectedJob?.location}</Text>
              </View>

              {/* Quick info row */}
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mức lương</Text>
                  <Text style={styles.infoValue}>
                    {formatSalary(selectedJob?.salary_min, selectedJob?.salary_max, selectedJob?.salary_negotiable)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Địa điểm</Text>
                  <Text style={styles.infoValue}>{selectedJob?.location}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Hình thức</Text>
                  <Text style={styles.infoValue}>
                    {selectedJob?.job_type === 'internship' ? 'Thực tập sinh' : 'Toàn thời gian'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Số lượng</Text>
                  <Text style={styles.infoValue}>{selectedJob?.quantity || 1} người</Text>
                </View>
              </View>

              {/* Mô tả */}
              <Text style={styles.sectionHeader}>📋 Mô tả công việc</Text>
              <Text style={styles.sectionBody}>{selectedJob?.description || 'Chưa cập nhật'}</Text>

              {/* Yêu cầu */}
              {selectedJob?.requirements && (
                <>
                  <Text style={styles.sectionHeader}>🎯 Yêu cầu ứng viên</Text>
                  <Text style={styles.sectionBody}>{selectedJob?.requirements}</Text>
                </>
              )}

              {/* Quyền lợi */}
              {selectedJob?.benefits && (
                <>
                  <Text style={styles.sectionHeader}>🎁 Quyền lợi được hưởng</Text>
                  <Text style={styles.sectionBody}>{selectedJob?.benefits}</Text>
                </>
              )}

              <View style={{ height: 30 }} />
            </ScrollView>

            <View style={[styles.modalFooter, { flexDirection: 'row', gap: 10 }]}>
              {selectedJob && (
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: savedJobIds.has(selectedJob.id) ? '#f59e0b' : '#cbd5e1',
                    backgroundColor: savedJobIds.has(selectedJob.id) ? '#fffbeb' : '#ffffff',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => handleToggleSave(selectedJob.id)}
                >
                  <Text style={{ fontSize: 14, color: savedJobIds.has(selectedJob.id) ? '#d97706' : '#64748b', fontWeight: '700' }}>
                    {savedJobIds.has(selectedJob.id) ? '★ Đã lưu' : '☆ Lưu tin'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.applyBtn, { flex: 1 }]} onPress={openApply}>
                <Text style={styles.applyBtnText}>Ứng tuyển ngay 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL NỘP HỒ SƠ ================= */}
      <Modal visible={applyModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nộp hồ sơ ứng tuyển</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 18, color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>
                Vị trí: {selectedJob?.title}
              </Text>
              <Text style={{ fontSize: 13, color: '#2563eb', marginBottom: 16 }}>
                Công ty: {selectedJob?.company_name}
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 }}>
                📄 CV sử dụng ứng tuyển:
              </Text>
              <View style={styles.cvCard}>
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                  {myCVs[0]?.title || 'CV Ứng viên UTEHY'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Trạng thái: CV trực tuyến mặc định
                </Text>
              </View>

              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 16, marginBottom: 6 }}>
                ✍️ Thư giới thiệu (Cover letter):
              </Text>
              <TextInput
                style={styles.coverLetterInput}
                multiline
                numberOfLines={4}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder="Nhập lời chào và mong muốn ứng tuyển..."
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.applyBtn, applying && { opacity: 0.6 }]}
                onPress={handleConfirmApply}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.applyBtnText}>Xác nhận nộp đơn</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: -0.5,
  },
  subLogoText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  userBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  guestBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  searchBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  smallChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  smallChipActive: {
    backgroundColor: '#dbeafe',
  },
  smallChipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: '#1d4ed8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tagBadgeSalary: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  tagBadgeSalaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  tagBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tagBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  tagBadgeType: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  tagBadgeTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 10,
  },
  companyBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCompanyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  modalCompanyAddress: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#334155',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  applyBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  cvCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  coverLetterInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    minHeight: 90,
  },
});
