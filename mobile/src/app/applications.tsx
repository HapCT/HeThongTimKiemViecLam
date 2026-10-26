import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getMyApplications } from '../services/api';

export default function ApplicationsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadData();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getMyApplications();
      setApplications(data);
    } catch (err: any) {
      console.error('loadData error:', err);
      Alert.alert('Thông báo', err.message || 'Không thể tải danh sách ứng tuyển');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return { text: '⏳ Đã nộp hồ sơ', bg: '#fef3c7', color: '#b45309' };
      case 'viewed':
        return { text: '👁️ Đã xem hồ sơ', bg: '#e0f2fe', color: '#0369a1' };
      case 'interview':
        return { text: '📅 Mời phỏng vấn', bg: '#f3e8ff', color: '#7e22ce' };
      case 'accepted':
        return { text: '🎉 Tiếp nhận thực tập', bg: '#dcfce7', color: '#15803d' };
      case 'rejected':
        return { text: '❌ Chưa phù hợp', bg: '#fee2e2', color: '#b91c1c' };
      default:
        return { text: status, bg: '#f1f5f9', color: '#64748b' };
    }
  };

  const renderAppCard = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{item.company_name}</Text>
            <Text style={styles.jobTitle}>{item.job_title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            📅 Ngày nộp: {new Date(item.applied_at).toLocaleDateString('vi-VN')}
          </Text>
          <Text style={styles.infoText}>
            📍 {item.job_location || item.location || 'Hà Nội'}
          </Text>
        </View>

        {item.cover_letter ? (
          <View style={styles.letterBox}>
            <Text style={styles.letterLabel}>Thư giới thiệu của bạn:</Text>
            <Text style={styles.letterText} numberOfLines={3}>
              "{item.cover_letter}"
            </Text>
          </View>
        ) : null}

        {/* Lịch phỏng vấn gắn liền nếu có */}
        {item.interview_time ? (
          <View style={styles.interviewBox}>
            <Text style={styles.interviewTitle}>🗓️ Lịch hẹn phỏng vấn:</Text>
            <Text style={styles.interviewTime}>
              ⏰ {new Date(item.interview_time).toLocaleString('vi-VN')}
            </Text>
            {item.interview_location ? (
              <Text style={styles.interviewLocation}>
                {item.interview_format === 'online' ? '🌐 Google Meet: ' : '🏢 Địa điểm: '}
                {item.interview_location}
              </Text>
            ) : null}
          </View>
        ) : null}

        {item.note ? (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackTitle}>💬 Phản hồi từ nhà tuyển dụng:</Text>
            <Text style={styles.feedbackText}>{item.note}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ đã ứng tuyển 📋</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi tiến trình xét duyệt hồ sơ thực tập của bạn
        </Text>
      </View>

      {!user ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 50, marginBottom: 12 }}>🔒</Text>
          <Text style={styles.emptyTitle}>Chưa đăng nhập tài khoản</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập tài khoản Ứng viên UTEHY để theo dõi các đơn ứng tuyển của bạn.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, color: '#64748b' }}>Đang tải lịch sử ứng tuyển...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAppCard}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📁</Text>
              <Text style={styles.emptyTitle}>Chưa có đơn ứng tuyển nào</Text>
              <Text style={styles.emptyDesc}>
                Hãy khám phá các vị trí thực tập hấp dẫn tại tab "Việc làm" và nộp hồ sơ ngay nhé!
              </Text>
            </View>
          }
        />
      )}
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
  },
  letterBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  letterLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  letterText: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
  },
  interviewBox: {
    backgroundColor: '#faf5ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#9333ea',
  },
  interviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7e22ce',
  },
  interviewTime: {
    fontSize: 13,
    fontWeight: '800',
    color: '#581c87',
    marginTop: 2,
  },
  interviewLocation: {
    fontSize: 12,
    color: '#6b21a8',
    marginTop: 2,
  },
  feedbackBox: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  feedbackText: {
    fontSize: 12.5,
    color: '#1e3a8a',
    marginTop: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
