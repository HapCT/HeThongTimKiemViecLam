import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredUser, getToken, loginStudent, registerStudent, clearAuth, getMe } from '../services/api';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const token = await getToken();
        if (token) {
          const stored = await getStoredUser();
          if (stored) setUser(stored);
          try {
            const fresh = await getMe();
            if (fresh) setUser(fresh);
          } catch (err: any) {
            if (err?.message?.includes('hết hạn') || err?.message?.includes('401') || err?.message?.includes('xác thực')) {
              await clearAuth();
              setUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Init auth error:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      setLoading(true);
      const res = await loginStudent(email, pass);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Đăng nhập thất bại' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const res = await registerStudent(data);
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Đăng ký thất bại' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const fresh = await getMe();
      if (fresh) setUser(fresh);
    } catch (err: any) {
      console.warn('Lỗi làm mới thông tin ứng viên:', err?.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
