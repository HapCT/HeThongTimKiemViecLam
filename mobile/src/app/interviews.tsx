import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getMyInterviews, confirmInterview } from '../services/api';

export default function InterviewsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<any[]>([]);
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
      const data = await getMyInterviews();
      setInterviews(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải lịch phỏng vấn');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleJoinMeeting = (url: string) => {
    if (!url) {
      Alert.alert('Thông báo', 'Chưa có liên kết phòng họp');
      return;
    }
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(cleanUrl).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở liên kết phòng họp');
    });
  };

  const handleConfirm = async (id: number) => {
    try {
      await confirmInterview(id);
      Alert.alert('Thành công', 'Bạn đã xác nhận tham gia buổi phỏng vấn!');
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể xác nhận');
    }
  };

  const renderInterviewCard = ({ item }: { item: any }) => {
    const isOnline = item.format === 'online' || (item.location && item.location.includes('http'));

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{item.company_name}</Text>
            <Text style={styles.jobTitle}>{item.job_title}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'confirmed'
                ? { backgroundColor: '#dcfce7' }
                : { backgroundColor: '#eff6ff' },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                item.status === 'confirmed' ? { color: '#15803d' } : { color: '#2563eb' },
              ]}
            >
              {item.status === 'confirmed' ? '✓ Đã xác nhận' : '⏳ Chờ diễn ra'}
            </Text>
          </View>
        </View>

        {/* Thời gian */}
        <View style={styles.timeBox}>
          <Text style={styles.timeIcon}>⏰</Text>
          <View>
            <Text style={styles.timeText}>
              {new Date(item.scheduled_at).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              - {new Date(item.scheduled_at).toLocaleDateString('vi-VN')}
            </Text>
            <Text style={styles.formatText}>
              {isOnline ? '🌐 Phỏng vấn trực tuyến (Google Meet)' : '🏢 Phỏng vấn trực tiếp tại văn phòng'}
            </Text>
          </View>
        </View>

        {item.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>📝 Lưu ý: {item.note}</Text>
          </View>
        ) : null}

        {/* Nút hành động */}
        <View style={styles.actionRow}>
          {isOnline && (
            <TouchableOpacity
              style={styles.meetBtn}
              onPress={() => handleJoinMeeting(item.location)}
            >
              <Text style={styles.meetBtnText}>Vào phòng Google Meet 📹</Text>
            </TouchableOpacity>
          )}

          {item.status === 'scheduled' && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleConfirm(item.id)}
            >
              <Text style={styles.confirmBtnText}>Xác nhận tham gia</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch phỏng vấn 📅</Text>
        <Text style={styles.headerSubtitle}>
          Thông tin buổi gặp gỡ và trao đổi cùng nhà tuyển dụng
        </Text>
      </View>

      {!user ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 50, marginBottom: 12 }}>🔒</Text>
          <Text style={styles.emptyTitle}>Chưa đăng nhập tài khoản</Text>
          <Text style={styles.emptyDesc}>
            Vui lòng đăng nhập tài khoản Ứng viên UTEHY để xem lịch hẹn phỏng vấn.
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
          <Text style={{ marginTop: 12, color: '#64748b' }}>Đang tải lịch phỏng vấn...</Text>
        </View>
      ) : (
        <FlatList
          data={interviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderInterviewCard}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🗓️</Text>
              <Text style={styles.emptyTitle}>Chưa có lịch phỏng vấn</Text>
              <Text style={styles.emptyDesc}>
                Khi doanh nghiệp duyệt hồ sơ và gửi lời mời phỏng vấn, lịch hẹn sẽ tự động xuất hiện tại đây.
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
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  timeIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  formatText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  noteBox: {
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  noteText: {
    fontSize: 12,
    color: '#b45309',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  meetBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  meetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
