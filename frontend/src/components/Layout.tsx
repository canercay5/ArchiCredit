import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { auth, logout, isAdmin } = useAuth();
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
        <span style={{ fontWeight: 700, fontSize: 20, marginRight: 8 }}>🏦 ArchiCredit</span>

        {isAdmin ? (
          <>
            <Link to="/customers" style={navLink}>Müşteriler</Link>
            <Link to="/loans" style={navLink}>Finansmanlar</Link>
            <Link to="/payments" style={navLink}>Ödemeler</Link>
          </>
        ) : (
          <>
            <Link to="/loans" style={navLink}>Finansmanlarım</Link>
            <Link to="/profile" style={navLink}>Profilim</Link>
          </>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.85 }}>
          {auth?.username}
          <span style={{ marginLeft: 6, background: isAdmin ? '#c62828' : '#1565c0', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
            {isAdmin ? 'Admin' : 'Müşteri'}
          </span>
        </span>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
          padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13
        }}>Çıkış</button>
      </nav>
      <main style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}

const navLink: React.CSSProperties = { color: '#fff', textDecoration: 'none', fontSize: 14 };
