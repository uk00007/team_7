import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout, StudentLayout } from '../components/layout/Layouts';
import { LandingPage, RoleSelectionPage } from '../pages/auth/AuthPages';
import {
  ActivityDetailsPage,
  CertificatePage,
  LearnPage,
  ProfilePage,
  ProgressPage,
  QuizAttemptPage,
  QuizResultPage,
  StudentHomePage,
} from '../pages/student/StudentPages';
import {
  AdminDashboardPage,
  AdminProfilePage,
  EditorPage,
  InsightsPage,
  ManagePage,
} from '../pages/admin/AdminPages';

const ProtectedRoute = ({ children }) => children;
const StudentRoute = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;
const AdminRoute = ({ children }) => <ProtectedRoute>{children}</ProtectedRoute>;

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role" element={<RoleSelectionPage />} />

        <Route
          path="/student"
          element={<StudentRoute><StudentLayout /></StudentRoute>}
        >
          <Route index element={<Navigate to="/student/home" replace />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="activity/:id" element={<ActivityDetailsPage />} />
          <Route path="quiz/:id" element={<QuizAttemptPage />} />
          <Route path="quiz/:id/result" element={<QuizResultPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="certificate/:id" element={<CertificatePage />} />
        </Route>

        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="manage" element={<ManagePage />} />
          <Route path="editor/:type?/:id?" element={<EditorPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
