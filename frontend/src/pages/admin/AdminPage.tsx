import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, Company } from '../../api/admin';

export default function AdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setCompanies(await adminApi.getCompanies());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    await adminApi.createCompany(newName.trim());
    setNewName('');
    await load();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete company and all its projects?')) return;
    await adminApi.deleteCompany(id);
    await load();
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Companies</h1>
      </div>

      <div style={s.createRow}>
        <input
          style={s.input}
          placeholder="New company name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button style={s.btn} onClick={handleCreate} disabled={loading || !newName.trim()}>
          + Add
        </button>
      </div>

      <div style={s.list}>
        {companies.map(c => (
          <div key={c.id} style={s.card}>
            <div style={s.cardMain} onClick={() => navigate(`/admin/companies/${c.id}`)}>
              <span style={s.cardName}>{c.name}</span>
              <span style={s.cardMeta}>{c.project_count} project{c.project_count !== 1 ? 's' : ''}</span>
            </div>
            <button style={s.deleteBtn} onClick={() => handleDelete(c.id)}>✕</button>
          </div>
        ))}
        {companies.length === 0 && <p style={s.empty}>No companies yet</p>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#111', margin: 0 },
  createRow: { display: 'flex', gap: 10, marginBottom: 24 },
  input: { flex: 1, padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' },
  btn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', background: '#fff', cursor: 'pointer' },
  cardMain: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#111' },
  cardMeta: { fontSize: 13, color: '#6b7280' },
  deleteBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16, padding: '4px 8px' },
  empty: { color: '#9ca3af', textAlign: 'center', padding: '40px 0' },
};
