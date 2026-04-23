import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, Company } from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';

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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Delete company and all its projects?')) return;
    await adminApi.deleteCompany(id);
    await load();
  }

  return (
    <AdminLayout>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.title}>Companies</h1>
          <p style={s.subtitle}>Manage companies and their interview projects</p>
        </div>
      </div>

      <div style={s.createCard}>
        <input
          style={s.input}
          placeholder="Company name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button style={s.btn} onClick={handleCreate} disabled={loading || !newName.trim()}>
          {loading ? '...' : '+ Add Company'}
        </button>
      </div>

      <div style={s.grid}>
        {companies.map(c => (
          <div key={c.id} style={s.card} onClick={() => navigate(`/admin/companies/${c.id}`)}>
            <div style={s.cardIcon}>🏢</div>
            <div style={s.cardBody}>
              <div style={s.cardName}>{c.name}</div>
              <div style={s.cardMeta}>
                {c.project_count} project{Number(c.project_count) !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={s.cardActions}>
              <button style={s.arrowBtn}>→</button>
              <button style={s.deleteBtn} onClick={e => handleDelete(e, c.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>🏢</div>
          <div style={s.emptyText}>No companies yet</div>
          <div style={s.emptyHint}>Add your first company above</div>
        </div>
      )}
    </AdminLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageHeader: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#64748b', margin: 0 },
  createCard: { display: 'flex', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  input: { flex: 1, padding: '10px 14px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', color: '#0f172a', background: '#f8fafc' },
  btn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' },
  grid: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardIcon: { fontSize: 28, width: 48, height: 48, background: '#eef2ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  cardMeta: { fontSize: 13, color: '#64748b' },
  cardActions: { display: 'flex', alignItems: 'center', gap: 4 },
  arrowBtn: { background: 'none', border: 'none', color: '#6366f1', fontSize: 18, cursor: 'pointer', padding: '4px 8px' },
  deleteBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 6 },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 600, color: '#334155', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#94a3b8' },
};
