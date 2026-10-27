import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendChatMessage, ChatMessage } from '../services/api';

type DisplayMessage = ChatMessage & { jobs?: any[]; error?: boolean };

// Server nhận tối đa 20 tin mỗi lần gọi
const MAX_HISTORY = 20;

const SUGGESTIONS = ['Tìm thực tập React ở Hà Nội', 'Việc bán thời gian lương từ 5 triệu', 'Có tin tuyển Tester nào không?'];

const jobTypeLabels: Record<string, string> = {
  internship: 'Thực tập',
  full_time: 'Toàn thời gian',
  part_time: 'Bán thời gian',
};

const formatSalary = (min?: number, max?: number, neg?: number) => {
  if (neg || (!min && !max)) return 'Thỏa thuận';
  if (min && max) return `${(min / 1000000).toFixed(0)} - ${(max / 1000000).toFixed(0)} triệu`;
  return min ? `Từ ${(min / 1000000).toFixed(0)} triệu` : `Đến ${(max! / 1000000).toFixed(0)} triệu`;
};

export default function ChatbotScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;

    const next: DisplayMessage[] = [...messages, { role: 'user', text: content }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      // Tin báo lỗi chỉ để hiển thị, không gửi lại cho bot
      const history = next
        .filter((m) => !m.error)
        .slice(-MAX_HISTORY)
        .map(({ role, text: t }) => ({ role, text: t }));
      const data = await sendChatMessage(history);
      setMessages((prev) => [...prev, { role: 'model', text: data.reply, jobs: data.jobs }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'model', text: err.message, error: true }]);
    } finally {
      setSending(false);
    }
  };

  // Mở chi tiết tin ở tab Việc làm (màn hình đó tự mở modal khi có jobId)
  const openJob = (id: number) => {
    router.navigate({ pathname: '/', params: { jobId: String(id) } });
  };

  const renderMessage = (m: DisplayMessage, key: React.Key) => {
    const isUser = m.role === 'user';
    return (
      <View key={key} style={[styles.row, isUser && styles.rowUser]}>
        <View style={{ maxWidth: '88%' }}>
          <View style={[styles.bubble, isUser ? styles.bubbleUser : m.error ? styles.bubbleError : styles.bubbleBot]}>
            <Text style={isUser ? styles.textUser : m.error ? styles.textError : styles.textBot}>{m.text}</Text>
          </View>
          {m.jobs?.map((job) => (
            <TouchableOpacity key={job.id} activeOpacity={0.8} style={styles.jobCard} onPress={() => openJob(job.id)}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company_name}</Text>
              <Text style={styles.jobMeta}>
                {jobTypeLabels[job.job_type] || job.job_type} · 📍 {job.location} · 💰{' '}
                {formatSalary(job.salary_min, job.salary_max, job.salary_negotiable)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trợ lý tìm việc 🤖</Text>
        <Text style={styles.headerSubtitle}>Hỏi bằng lời, trợ lý tìm tin tuyển dụng phù hợp cho bạn</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {renderMessage(
            { role: 'model', text: 'Chào bạn! Mình giúp bạn tìm việc làm, thực tập trên hệ thống. Bạn muốn tìm vị trí gì, ở đâu?' },
            'welcome'
          )}
          {messages.length === 0 &&
            SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestion} onPress={() => send(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          {messages.map((m, i) => renderMessage(m, i))}
          {sending && (
            <View style={styles.typing}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.typingText}>Đang tìm...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            placeholder="Nhập câu hỏi..."
            placeholderTextColor="#94a3b8"
            maxLength={1000}
            editable={!sending}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (sending || !input.trim()) && { opacity: 0.5 }]}
            onPress={() => send(input)}
            disabled={sending || !input.trim()}
          >
            <Text style={styles.sendText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleUser: {
    backgroundColor: '#2563eb',
  },
  bubbleBot: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bubbleError: {
    backgroundColor: '#fef2f2',
  },
  textUser: {
    color: '#ffffff',
    fontSize: 14,
  },
  textBot: {
    color: '#0f172a',
    fontSize: 14,
  },
  textError: {
    color: '#b91c1c',
    fontSize: 14,
  },
  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  jobCompany: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  jobMeta: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '600',
  },
  suggestion: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  suggestionText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    color: '#64748b',
    fontSize: 13,
  },
  inputBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  sendBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
