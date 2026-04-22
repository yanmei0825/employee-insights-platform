import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LanguageSelectPage from './pages/LanguageSelectPage';
import InterviewPage from './pages/InterviewPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/survey/:token" element={<LanguageSelectPage />} />
        <Route path="/survey/:token/chat" element={<InterviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
