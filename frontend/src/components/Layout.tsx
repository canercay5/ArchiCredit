import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <nav style={{
        background: '#1a237e', color: '#fff', padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 24, height: 56
      }}>
        <span style={{ fontWeight: 700, fontSize: 20, marginRight: 16 }}>🏦 ArchiCredit</span>
        <Link to="/customers" style={{ color: '#fff', textDecoration: 'none' }}>Müşteriler</Link>
        <Link to="/loans" style={{ color: '#fff', textDecoration: 'none' }}>Krediler</Link>
        <Link to="/payments" style={{ color: '#fff', textDecoration: 'none' }}>Ödemeler</Link>
        <span style={{ marginLeft: 'auto', fontSize: 14 }}>
          {auth?.username} ({auth?.role})
        </span>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          padding: '6px 14px', borderRadius: 4, cursor: 'pointer'
        }}>Çıkış</button>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
