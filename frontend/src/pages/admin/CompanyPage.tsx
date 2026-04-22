import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, Project } from '../../api/admin';

export default function CompanyPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', hasDemographics: false, languages: ['ru', 'en', 'tr'] });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function load() {
    if (!companyId) return;
    setProjects(await adminApi.getProjects(companyId));
  }

  useEffect(() => { load(); }, [companyId]);

  async function handleCreate() {
    if (!companyId || !form.name.trim()) return;
    await adminApi.createProject(companyId, { ...form, name: form.name.trim() });
    setForm({ name: '', description: '', hasDemographics: false, languages: ['ru', 'en', 'tr'] });
    setShowForm(false);
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete project and all sessions?')) return;
    await adminApi.deleteProject(id);
    await load();
  }

  async function handleGenerateLink(projectId: string) {
    const result = await adminApi.generateLink(projectId);
    setGeneratedLink(result.url);
  }

  async function copyLink(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleLang(lang: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  }

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate('/admin')}>← Back</button>
      <div style={s.header}>
        <h1 style={s.title}>Projects</h1>
        <button style={s.btn} onClick={() => setShowForm(v => !v)}>+ New Project</button>
      </div>

      {showForm && (
        <div style={s.form}>
          <input style={s.input} placeholder="Project name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input style={s.input} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={s.row}>
            <label style={s.label}>
              <input type="checkbox" checked={form.hasDemographics} onChange={e => setForm(f => ({ ...f, hasDemographics: e.target.checked }))} />
              {' '}Collect demographics (name, department, position)
            </label>
          </div>
          <div style={s.row}>
            <span style={s.label}>Languages:</span>
            {(['ru', 'en', 'tr'] as const).map(l => (
              <label key={l} style={s.langLabel}>
                <input type="checkbox" checked={form.languages.includes(l)} onChange={() => toggleLang(l)} />
                {' '}{l.toUpperCase()}
              </label>
            ))}
          </div>
          <div style={s.formActions}>
            <button style={s.btn} onClick={handleCreate} disabled={!form.name.trim() || form.languages.length === 0}>Create</button>
            <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {generatedLink && (
        <div style={s.linkBox}>
          <span style={s.linkText}>{generatedLink}</span>
          <button style={s.copyBtn} onClick={() => copyLink(generatedLink, 'modal')}>
            {copiedId === 'modal' ? '✓ Copied' : 'Copy'}
          </button>
          <button style={s.closeLink} onClick={() => setGeneratedLink(null)}>✕</button>
        </div>
      )}

      <div style={s.list}>
        {projects.map(p => (
          <div key={p.id} style={s.card}>
            <div style={s.cardTop}>
              <div>
                <div style={s.cardName}>{p.name}</div>
                {p.description && <div style={s.cardDesc}>{p.description}</div>}
              </div>
              <button style={s.deleteBtn} onClick={() => handleDelete(p.id)}>✕</button>
            </div>
            <div style={s.cardMeta}>
              <span style={s.tag}>{p.languages.join(' · ')}</span>
              {p.has_demographics && <span style={s.tag}>Demographics</span>}
              <span style={s.stat}>{p.session_count} sessions · {p.completed_count} completed</span>
            </div>
            <div style={s.cardActions}>
              <button style={s.linkBtn} onClick={() => handleGenerateLink(p.id)}>Generate Link</button>
              <button style={s.analyticsBtn} onClick={() => navigate(`/admin/projects/${p.id}/analytics`)}>Analytics</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && <p style={s.empty}>No projects yet</p>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 700, color: '#111', margin: 0 },
  btn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  cancelBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  form: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '10px 14px', fontSize: 15, border: '1px solid #d1d5db', borderRadius: 8, outline: 'none' },
  row: { display: 'flex', alignItems: 'center', gap: 16 },
  label: { fontSize: 14, color: '#374151' },
  langLabel: { fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 },
  formActions: { display: 'flex', gap: 10 },
  linkBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px', marginBottom: 20 },
  linkText: { flex: 1, fontSize: 13, color: '#1d4ed8', wordBreak: 'break-all' },
  copyBtn: { padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  closeLink: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px', background: '#fff' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#111' },
  cardDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  cardMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  tag: { fontSize: 12, background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 4 },
  stat: { fontSize: 12, color: '#9ca3af' },
  cardActions: { display: 'flex', gap: 8 },
  linkBtn: { padding: '7px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  analyticsBtn: { padding: '7px 14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  deleteBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 16 },
  empty: { color: '#9ca3af', textAlign: 'center', padding: '40px 0' },
};
