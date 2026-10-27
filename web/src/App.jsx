import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatbotWidget from './components/ChatbotWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for optimized bundle splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const CandidateProfilePage = lazy(() => import('./pages/CandidateProfilePage'));
const CandidateCVPage = lazy(() => import('./pages/CandidateCVPage'));
const CandidateApplicationsPage = lazy(() => import('./pages/CandidateApplicationsPage'));
const CandidateSavedJobsPage = lazy(() => import('./pages/CandidateSavedJobsPage'));
const CandidateInterviewsPage = lazy(() => import('./pages/CandidateInterviewsPage'));

const CompanyDashboardPage = lazy(() => import('./pages/CompanyDashboardPage'));
const CompanyApplicantsPage = lazy(() => import('./pages/CompanyApplicantsPage'));
const CompanyInterviewsPage = lazy(() => import('./pages/CompanyInterviewsPage'));

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminJobApprovalPage = lazy(() => import('./pages/AdminJobApprovalPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'));

function PageLoading() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
}

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
          borderRadius: 8,
          borderRadiusSM: 4,
          borderRadiusLG: 12,
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Suspense fallback={<PageLoading />}>
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

                  {/* Real 404 Fallback */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <ChatbotWidget />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
