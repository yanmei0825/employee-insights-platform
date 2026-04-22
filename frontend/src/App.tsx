import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LanguageSelectPage from './pages/LanguageSelectPage';
import InterviewPage from './pages/InterviewPage';
import DevStartPage from './pages/DevStartPage';
import AdminPage from './pages/admin/AdminPage';
import CompanyPage from './pages/admin/CompanyPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/companies/:companyId" element={<CompanyPage />} />
        <Route path="/admin/projects/:projectId/analytics" element={<AnalyticsPage />} />

        {/* Survey */}
        <Route path="/survey/:token" element={<LanguageSelectPage />} />
        <Route path="/survey/:token/chat" element={<InterviewPage />} />

        {/* Dev helper */}
        <Route path="/" element={<DevStartPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
