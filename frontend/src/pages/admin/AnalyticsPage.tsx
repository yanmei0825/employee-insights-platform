import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, Analytics } from '../../api/admin';
import AdminLayout from '../../components/AdminLayout';

const DIMS: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'D1', label: 'Meaning & Pride', emoji: '✨' },
  { key: 'D2', label: 'Workload', emoji: '⚡' },
  { key: 'D3', label: 'Recognition', emoji: '🏆' },
  { key: 'D4', label: 'Management', emoji: '👔' },
  { key: 'D5', label: 'Colleagues', emoji: '🤝' },
  { key: 'D6', label: 'Growth', emoji: '📈' },
  { key: 'D7', label: 'Balance', emoji: '⚖️' },
  { key: 'D8', label: 'Voice', emoji: '🎙️' },
  { key: 'D9', label: 'Obstacles', emoji: '🚧' },
  { key: 'D10', label: 'Overall', emoji: '🌐' },
];

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    if (projectId) adminApi.getAnalytics(projectId).then(setData);
  }, [projectId]);

  if (!data) return (
    <AdminLayout>
      <div style={s.loading}>Loading analytics...</div>
    </AdminLayout>
  );

  const maxCoverage = Math.max(...Object.values(data.dimensionCoverage), 1);

  function getColor(pct: number) {
    if (pct >= 75) return '#22c55e';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  return (
    <AdminLayout>
      <button style={s.back} onClick={() => navigate(-1)}>← Back to Projects</button>
      <div style={s.pageHeader}>
        <h1 style={s.title}>Analytics</h1>
        <p style={s.subtitle}>Interview coverage and completion statistics</p>
      </div>

      <div style={s.statsRow}>
        {[
          { label: 'Total Sessions', value: data.total, icon: '📋', color: '#6366f1' },
          { label: 'Completed', value: data.completed, icon: '✅', color: '#22c55e' },
          { label: 'Completion Rate', value: `${data.completionRate}%`, icon: '📊', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={s.statCard}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={{ ...s.statNum, color: stat.color }}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>Dimension Coverage</h2>
        <p style={s.sectionHint}>How many respondents covered each topic</p>
        <div style={s.dimList}>
          {DIMS.map(({ key, label, emoji }) => {
            const count = data.dimensionCoverage[key] || 0;
            const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
            const barWidth = maxCoverage > 0 ? (count / maxCoverage) * 100 : 0;
            const color = getColor(pct);
            return (
              <div key={key} style={s.dimRow}>
                <div style={s.dimLeft}>
                  <span style={s.dimEmoji}>{emoji}</span>
                  <span style={s.dimKey}>{key}</span>
                  <span style={s.dimLabel}>{label}</span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${barWidth}%`, background: color }} />
                </div>
                <div style={{ ...s.dimPct, color }}>{pct}%</div>
                <div style={s.dimCount}>{count}/{data.total}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}

const s: Record<string, React.CSSProperties> = {
  loading: { textAlign: 'center', padding: 80, color: '#94a3b8', fontSize: 16 },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, padding: '0 0 16px', fontWeight: 500 },
  pageHeader: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#64748b', margin: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 },
  statCard: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statIcon: { fontSize: 28, marginBottom: 10 },
  statNum: { fontSize: 36, fontWeight: 800, marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  section: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' },
  sectionHint: { fontSize: 13, color: '#94a3b8', margin: '0 0 24px' },
  dimList: { display: 'flex', flexDirection: 'column', gap: 14 },
  dimRow: { display: 'flex', alignItems: 'center', gap: 12 },
  dimLeft: { display: 'flex', alignItems: 'center', gap: 8, width: 220, flexShrink: 0 },
  dimEmoji: { fontSize: 16 },
  dimKey: { fontSize: 12, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '2px 6px', borderRadius: 4 },
  dimLabel: { fontSize: 13, color: '#475569', fontWeight: 500 },
  barTrack: { flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 0.5s ease' },
  dimPct: { width: 40, fontSize: 13, fontWeight: 700, textAlign: 'right', flexShrink: 0 },
  dimCount: { width: 50, fontSize: 12, color: '#94a3b8', textAlign: 'right', flexShrink: 0 },
};
