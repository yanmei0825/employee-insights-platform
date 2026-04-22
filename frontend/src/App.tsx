import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LanguageSelectPage from './pages/LanguageSelectPage';
import InterviewPage from './pages/InterviewPage';
import DevStartPage from './pages/DevStartPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DevStartPage />} />
        <Route path="/survey/:token" element={<LanguageSelectPage />} />
        <Route path="/survey/:token/chat" element={<InterviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}
