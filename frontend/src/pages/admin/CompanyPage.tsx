import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, Project } from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';

const LANG_FLAGS: Record<string, string> = { ru: '🇷🇺', en: '🇬🇧', tr: '🇹🇷' };

export default function CompanyPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', hasDemographics: false, languages: ['ru', 'en', 'tr'] });
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

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

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Delete project and all sessions?')) return;
    await adminApi.deleteProject(id);
    await load();
  }

  async function handleGenerateLink(e: React.MouseEvent, projectId: string) {
    e.stopPropagation();
    const result = await adminApi.generateLink(projectId);
    setGeneratedLinks(prev => ({ ...prev, [projectId]: result.url }));
  }

  async function copyLink(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleLang(lang: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
    }));
  }

  return (
    <AdminLayout>
      <div style={s.pageHeader}>
        <button style={s.back} onClick={() => navigate('/admin')}>← Companies</button>
        <div style={s.headerRow}>
          <div>
            <h1 style={s.title}>Projects</h1>
            <p style={s.subtitle}>Create projects and generate interview links for employees</p>
          </div>
          <button style={s.btn} onClick={() => setShowForm(v => !v)}>+ New Project</button>
        </div>
      </div>

      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>New Project</h3>
          <div style={s.formGrid}>
            <div style={s.formField}>
              <label style={s.label}>Project name *</label>
              <input style={s.input} placeholder="e.g. Q2 Employee Survey" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={s.formField}>
              <label style={s.label}>Description</label>
              <input style={s.input} placeholder="Optional" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div style={s.formRow}>
            <div style={s.formField}>
              <label style={s.label}>Languages</label>
              <div style={s.langRow}>
                {(['ru', 'en', 'tr'] as const).map(l => (
                  <button
                    key={l}
                    style={{ ...s.langBtn, ...(form.languages.includes(l) ? s.langBtnActive : {}) }}
                    onClick={() => toggleLang(l)}
                    type="button"
                  >
                    {LANG_FLAGS[l]} {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.formField}>
              <label style={s.label}>Demographics</label>
              <label style={s.toggle}>
                <input type="checkbox" checked={form.hasDemographics} onChange={e => setForm(f => ({ ...f, hasDemographics: e.target.checked }))} />
                <span style={s.toggleLabel}>Collect name, department, position</span>
              </label>
            </div>
          </div>
          <div style={s.formActions}>
            <button style={s.btn} onClick={handleCreate} disabled={!form.name.trim() || form.languages.length === 0}>Create Project</button>
            <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={s.list}>
        {projects.map(p => (
          <div key={p.id} style={s.card}>
            <div style={s.cardHeader}>
              <div style={s.cardIcon}>📋</div>
              <div style={s.cardBody}>
                <div style={s.cardName}>{p.name}</div>
                {p.description && <div style={s.cardDesc}>{p.description}</div>}
              </div>
              <button style={s.deleteBtn} onClick={e => handleDelete(e, p.id)}>✕</button>
            </div>

            <div style={s.cardTags}>
              {p.languages.map(l => (
                <span key={l} style={s.tag}>{LANG_FLAGS[l]} {l.toUpperCase()}</span>
              ))}
              {p.has_demographics && <span style={{ ...s.tag, ...s.tagPurple }}>👤 Demographics</span>}
              <span style={s.statTag}>
                {p.session_count} sessions · {p.completed_count} completed
              </span>
            </div>

            <div style={s.cardFooter}>
              <button style={s.linkBtn} onClick={e => handleGenerateLink(e, p.id)}>
                🔗 Generate Link
              </button>
              <button style={s.analyticsBtn} onClick={() => navigate(`/admin/projects/${p.id}/analytics`)}>
                📊 Analytics
              </button>
            </div>

            {generatedLinks[p.id] && (
              <div style={s.linkBox}>
                <span style={s.linkText}>{generatedLinks[p.id]}</span>
                <button style={s.copyBtn} onClick={() => copyLink(generatedLinks[p.id], p.id)}>
                  {copied === p.id ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {projects.length === 0 && !showForm && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyText}>No projects yet</div>
          <div style={s.emptyHint}>Create your first project to start collecting interviews</div>
        </div>
      )}
    </AdminLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  pageHeader: { marginBottom: 28 },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, padding: '0 0 12px', fontWeight: 500 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#64748b', margin: 0 },
  btn: { padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  cancelBtn: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 },
  formCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
  formField: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#475569' },
  input: { padding: '10px 14px', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', color: '#0f172a', background: '#f8fafc' },
  langRow: { display: 'flex', gap: 8 },
  langBtn: { padding: '7px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  langBtnActive: { border: '1.5px solid #6366f1', background: '#eef2ff', color: '#6366f1' },
  toggle: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 6 },
  toggleLabel: { fontSize: 14, color: '#475569' },
  formActions: { display: 'flex', gap: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  cardIcon: { fontSize: 24, width: 44, height: 44, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  cardDesc: { fontSize: 13, color: '#64748b' },
  cardTags: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 },
  tag: { fontSize: 12, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  tagPurple: { background: '#f5f3ff', color: '#7c3aed' },
  statTag: { fontSize: 12, color: '#94a3b8', padding: '3px 0' },
  cardFooter: { display: 'flex', gap: 8 },
  linkBtn: { padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  analyticsBtn: { padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  deleteBtn: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14, padding: '4px' },
  linkBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', marginTop: 14 },
  linkText: { flex: 1, fontSize: 13, color: '#0369a1', wordBreak: 'break-all' },
  copyBtn: { padding: '6px 14px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 600, color: '#334155', marginBottom: 6 },
  emptyHint: { fontSize: 14, color: '#94a3b8' },
};
