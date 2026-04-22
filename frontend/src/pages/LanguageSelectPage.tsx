import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { setLanguage } from '../api/survey';

const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
];

export default function LanguageSelectPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  async function handleSelect(lang: string) {
    if (!token) return;
    const result = await setLanguage(token, lang);
    if (result.nextStep === 'demographics') {
      navigate(`/survey/${token}/demographics`);
    } else {
      navigate(`/survey/${token}/chat`);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Select language / Выберите язык / Dil seçin</h2>
      <div style={styles.btnGroup}>
        {LANGUAGES.map((l) => (
          <button key={l.code} style={styles.btn} onClick={() => handleSelect(l.code)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 32, fontFamily: 'system-ui, sans-serif' },
  title: { fontSize: 20, color: '#374151', textAlign: 'center' },
  btnGroup: { display: 'flex', gap: 16 },
  btn: { padding: '14px 32px', fontSize: 16, border: '2px solid #6366f1', borderRadius: 10, background: '#fff', color: '#6366f1', cursor: 'pointer', fontWeight: 600 },
};
