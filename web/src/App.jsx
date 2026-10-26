import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateCVPage from './pages/CandidateCVPage';
import CandidateApplicationsPage from './pages/CandidateApplicationsPage';
import CandidateSavedJobsPage from './pages/CandidateSavedJobsPage';
import CandidateInterviewsPage from './pages/CandidateInterviewsPage';

import CompanyDashboardPage from './pages/CompanyDashboardPage';
import CompanyApplicantsPage from './pages/CompanyApplicantsPage';
import CompanyInterviewsPage from './pages/CompanyInterviewsPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminJobApprovalPage from './pages/AdminJobApprovalPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorSuccess: '#059669',
          colorWarning: '#f59e0b',
          borderRadius: 0,
          borderRadiusSM: 0,
          borderRadiusLG: 0,
          borderRadiusXS: 0,
          borderRadiusOuter: 0,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/companies/:id" element={<CompanyDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Candidate Protected Routes */}
                <Route
                  path="/candidate/profile"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/cvs"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateCVPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/applications"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateApplicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/saved"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateSavedJobsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/interviews"
                  element={
                    <ProtectedRoute allowedRoles={['candidate']}>
                      <CandidateInterviewsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Company Protected Routes */}
                <Route
                  path="/company/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <CompanyDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/applicants"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <CompanyApplicantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/interviews"
                  element={
                    <ProtectedRoute allowedRoles={['company']}>
                      <CompanyInterviewsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminJobApprovalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminCategoriesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
