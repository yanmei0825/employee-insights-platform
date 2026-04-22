import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../api/survey';

// Dev/demo page to bootstrap a session with a projectId
export default function DevStartPage() {
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleStart() {
    setError('');
    try {
      const { token } = await createSession(projectId.trim());
      navigate(`/survey/${token}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Start Interview</h2>
      <p style={styles.hint}>Enter a valid Project ID (UUID) from the database</p>
      <input
        style={styles.input}
        placeholder="Project ID (UUID)"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      />
      <button style={styles.btn} onClick={handleStart} disabled={!projectId.trim()}>
        Create Session
      </button>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui, sans-serif' },
  title: { fontSize: 22, color: '#111' },
  hint: { fontSize: 13, color: '#6b7280' },
  input: { padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8, width: 340, outline: 'none' },
  btn: { padding: '10px 28px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#ef4444', fontSize: 13 },
};
