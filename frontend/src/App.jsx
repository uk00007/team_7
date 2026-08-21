import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { LandingPage, RoleSelectionPage } from './pages/auth/AuthPages';
import { StudentLayout, AdminLayout } from './components/layout/Layouts';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import {
  StudentHomePage,
  LearnPage,
  ActivityDetailsPage,
  QuizAttemptPage,
  QuizResultPage,
  ProgressPage,
  ProfilePage,
  CertificatePage,
} from './pages/student/StudentPages';
import { Leaderboard } from './pages/student/Leaderboard';
import { Team } from './pages/student/Team';
import { Certificates } from './pages/student/Certificates';
import {
  AdminDashboardPage,
  ManagePage,
  InsightsPage,
  EditorPage,
  AdminProfilePage,
} from './pages/admin/AdminPages';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LandingPage />} />
        <Route path="/role" element={<RoleSelectionPage />} />

        {/* Student Routes — all inside layout */}
        <Route element={<ProtectedRoute allowedRole="student" />}>
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<StudentHomePage />} />
            <Route path="/student/home" element={<StudentHomePage />} />
            <Route path="/student/activities" element={<LearnPage />} />
            <Route path="/student/learn" element={<LearnPage />} />
            <Route path="/student/activities/:id" element={<ActivityDetailsPage />} />
            <Route path="/student/activity/:id" element={<ActivityDetailsPage />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/team" element={<Team />} />
            <Route path="/student/certificates" element={<Certificates />} />
            <Route path="/student/progress" element={<ProgressPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
          </Route>
          {/* Quiz / cert pages are full-screen without the main sidebar */}
          <Route path="/student/quiz/:id" element={<QuizAttemptPage />} />
          <Route path="/student/quiz/:id/result" element={<QuizResultPage />} />
          <Route path="/student/certificate/:id" element={<CertificatePage />} />
        </Route>

        {/* Admin Routes — all inside layout */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/activities" element={<ManagePage />} />
            <Route path="/admin/manage" element={<ManagePage />} />
            <Route path="/admin/review" element={<ManagePage />} />
            <Route path="/admin/students" element={<ManagePage />} />
            <Route path="/admin/reports" element={<InsightsPage />} />
            <Route path="/admin/insights" element={<InsightsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>
          {/* Editor is full-screen without sidebar */}
          <Route path="/admin/editor/:type?/:id?" element={<EditorPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;


