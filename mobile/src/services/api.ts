import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Tự động nhận diện địa chỉ IP của máy dev qua Expo hostUri, fallback về IP mạng
const getDevHostIp = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }
  return '192.168.1.14';
};

export const API_BASE_URL = `http://${getDevHostIp()}:5000/api`;

const TOKEN_KEY = 'utehy_student_token';
const USER_KEY = 'utehy_student_user';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveAuth(token: string, user: any) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (e) {
    console.warn('Lỗi khi lưu token bảo mật:', e);
  }
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    console.warn('Lỗi khi xóa token bảo mật:', e);
  }
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getStoredUser(): Promise<any | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request(endpoint: string, options: RequestInit = {}, timeoutMs = 15000) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Mặc định timeout 15 giây
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (netErr: any) {
    clearTimeout(timeoutId);
    if (netErr.name === 'AbortError') {
      throw new Error(`Yêu cầu đã hết thời gian chờ kết nối (quá ${timeoutMs / 1000} giây). Vui lòng thử lại.`);
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.');
  } finally {
    clearTimeout(timeoutId);
  }

  // Nếu gặp 401 thì tự động đăng xuất
  if (response.status === 401) {
    await clearAuth();
    throw new Error('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr) {
    throw new Error(`Phản hồi máy chủ không hợp lệ (HTTP ${response.status})`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Có lỗi xảy ra khi kết nối máy chủ');
  }

  return data;
}

// ==================== AUTH ====================
export async function loginStudent(email: string, password: string) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const user = res.data?.user;
  const token = res.data?.token;

  // QUY TẮC QUAN TRỌNG: Trên Mobile CHỈ cho phép vai trò 'candidate' (Sinh viên)
  if (user?.role !== 'candidate') {
    throw new Error(
      'Tài khoản Quản trị viên (Admin) và Doanh nghiệp chỉ được phép sử dụng trên hệ thống Web máy tính.\nỨng dụng di động chỉ dành riêng cho Ứng viên.'
    );
  }

  await saveAuth(token, user);
  return { token, user };
}

export async function registerStudent(data: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  university?: string;
  major?: string;
}) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      role: 'candidate',
      password: data.password,
    }),
  });

  const user = res.data?.user;
  const token = res.data?.token;

  await saveAuth(token, user);
  return { token, user };
}

export async function getMe() {
  const res = await request('/auth/me');
  return res.data;
}

// ==================== JOBS ====================
export async function getJobs(params: {
  keyword?: string;
  category_id?: number | string;
  location?: string;
  job_type?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.category_id) searchParams.append('category_id', String(params.category_id));
  if (params.location) searchParams.append('location', params.location);
  if (params.job_type) searchParams.append('job_type', params.job_type);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const res = await request(`/jobs${query}`);
  return res.data?.jobs || [];
}

export async function getJobById(id: number | string) {
  const res = await request(`/jobs/${id}`);
  return res.data;
}

export async function getCategories() {
  const res = await request('/categories');
  return res.data || [];
}

// ==================== APPLICATIONS ====================
export async function applyJob(jobId: number | string, cvId: number | string, coverLetter: string) {
  const res = await request('/applications', {
    method: 'POST',
    body: JSON.stringify({
      job_id: jobId,
      cv_id: cvId,
      cover_letter: coverLetter,
    }),
  });
  return res;
}

export async function getMyApplications() {
  const res = await request('/applications/my-applications');
  return res.data || [];
}

// ==================== CVS ====================
export async function getMyCVs() {
  const res = await request('/candidates/cvs');
  return res.data || [];
}

// ==================== INTERVIEWS ====================
export async function getMyInterviews() {
  const res = await request('/interviews/candidate');
  return res.data || [];
}

export async function confirmInterview(id: number | string) {
  const res = await request(`/interviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'confirmed' }),
  });
  return res;
}

export async function declineInterview(id: number | string, note?: string) {
  const res = await request(`/interviews/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'declined', note: note || null }),
  });
  return res;
}

// ==================== SAVED JOBS ====================
export async function getSavedJobs() {
  const res = await request('/saved-jobs');
  return res.data || [];
}

export async function toggleSaveJob(jobId: number | string) {
  return await request('/saved-jobs/toggle', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

// ==================== CHATBOT ====================
export type ChatMessage = { role: 'user' | 'model'; text: string };

// Mỗi câu hỏi gọi Gemini 2 lượt (tra CSDL rồi trả lời), mỗi lượt có thể tới 30 giây
export async function sendChatMessage(messages: ChatMessage[]) {
  const res = await request('/chatbot', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  }, 70000);
  return res.data as { reply: string; jobs: any[] };
}
