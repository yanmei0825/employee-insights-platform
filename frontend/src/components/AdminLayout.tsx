import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.logo} onClick={() => navigate('/admin')}>
          <span style={s.logoIcon}>◈</span>
          <span style={s.logoText}>Interview</span>
        </div>
        <nav style={s.nav}>
          <button
            style={{ ...s.navItem, ...(location.pathname === '/admin' ? s.navActive : {}) }}
            onClick={() => navigate('/admin')}
          >
            <span style={s.navIcon}>🏢</span> Companies
          </button>
        </nav>
        <div style={s.sidebarFooter}>
          <span style={s.footerText}>v1.0</span>
        </div>
      </aside>
      <main style={s.main}>{children}</main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { width: 220, background: '#1e1b4b', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px 28px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 },
  logoIcon: { fontSize: 22, color: '#a5b4fc' },
  logoText: { fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 14, fontWeight: 500, textAlign: 'left', width: '100%', transition: 'all 0.15s' },
  navActive: { background: 'rgba(165,180,252,0.15)', color: '#a5b4fc' },
  navIcon: { fontSize: 16 },
  sidebarFooter: { padding: '16px 20px 0', borderTop: '1px solid rgba(255,255,255,0.08)' },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  main: { flex: 1, padding: '40px 48px', overflowY: 'auto' },
};
