import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi, Analytics } from '../../api/admin';

const DIM_LABELS: Record<string, string> = {
  D1: 'Meaning & Pride', D2: 'Workload', D3: 'Recognition',
  D4: 'Management', D5: 'Colleagues', D6: 'Growth',
  D7: 'Balance', D8: 'Voice', D9: 'Obstacles', D10: 'Overall',
};

export default function AnalyticsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    if (projectId) adminApi.getAnalytics(projectId).then(setData);
  }, [projectId]);

  if (!data) return <div style={s.loading}>Loading...</div>;

  const maxCoverage = Math.max(...Object.values(data.dimensionCoverage), 1);

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate(-1)}>← Back</button>
      <h1 style={s.title}>Analytics</h1>

      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statNum}>{data.total}</div>
          <div style={s.statLabel}>Total sessions</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statNum}>{data.completed}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statNum}>{data.completionRate}%</div>
          <div style={s.statLabel}>Completion rate</div>
        </div>
      </div>

      <h2 style={s.subtitle}>Dimension Coverage</h2>
      <div style={s.dimList}>
        {Object.entries(DIM_LABELS).map(([key, label]) => {
          const count = data.dimensionCoverage[key] || 0;
          const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;
          const barWidth = maxCoverage > 0 ? (count / maxCoverage) * 100 : 0;
          return (
            <div key={key} style={s.dimRow}>
              <div style={s.dimLabel}><span style={s.dimKey}>{key}</span> {label}</div>
              <div style={s.barTrack}>
                <div style={{ ...s.barFill, width: `${barWidth}%` }} />
              </div>
              <div style={s.dimCount}>{count} ({pct}%)</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui, sans-serif' },
  loading: { textAlign: 'center', padding: 80, color: '#9ca3af' },
  back: { background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 },
  title: { fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 24 },
  subtitle: { fontSize: 18, fontWeight: 600, color: '#111', margin: '32px 0 16px' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 8 },
  statCard: { flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '20px 16px', textAlign: 'center' },
  statNum: { fontSize: 32, fontWeight: 700, color: '#6366f1' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  dimList: { display: 'flex', flexDirection: 'column', gap: 10 },
  dimRow: { display: 'flex', alignItems: 'center', gap: 12 },
  dimLabel: { width: 200, fontSize: 14, color: '#374151', flexShrink: 0 },
  dimKey: { fontWeight: 700, color: '#6366f1' },
  barTrack: { flex: 1, height: 10, background: '#e5e7eb', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', background: '#6366f1', borderRadius: 5, transition: 'width 0.4s' },
  dimCount: { width: 70, fontSize: 13, color: '#6b7280', textAlign: 'right', flexShrink: 0 },
};
