import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount from token
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');

      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser));
          const res = await api.get('/auth/me');
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      if (res?.success) {
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('Đăng nhập thành công!');
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res?.message || 'Đăng nhập thất bại' };
    } catch (err) {
      const msg = err.message || 'Lỗi khi đăng nhập';
      message.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', formData);
      if (res?.success) {
        setUser(res.data.user);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('Đăng ký tài khoản mới thành công!');
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res?.message || 'Đăng ký thất bại' };
    } catch (err) {
      const msg = err.message || 'Lỗi khi đăng ký tài khoản';
      message.error(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Đã đăng xuất thành công');
    window.location.href = '/login';
  };

  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/auth/profile', formData);
      if (res?.success) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        message.success('Cập nhật hồ sơ thành công');
        return true;
      }
    } catch (err) {
      message.error(err.message);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res?.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        return res.data;
      }
    } catch (e) {
      console.warn('Lỗi khi làm mới thông tin user:', e.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        isAuthenticated: !!user,
        isCandidate: user?.role === 'candidate',
        isCompany: user?.role === 'company',
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
