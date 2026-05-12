import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthResult } from '../types';

export default function LoginPage() {
  const [tab, setTab] = useState<'customer' | 'admin'>('customer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResult>('/auth/login', { username, password });
      if (tab === 'admin' && data.role !== 'Admin') {
        setError('Bu kullanıcı admin değil.');
        return;
      }
      if (tab === 'customer' && data.role !== 'Customer') {
        setError('Müşteri girişi için müşteri hesabı kullanınız.');
        return;
      }
      login(data);
      navigate(data.role === 'Admin' ? '/customers' : '/loans');
    } catch {
      setError('Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#1a237e',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 40, width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 4 }}>🏦 ArchiCredit</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24, fontSize: 14 }}>Katılım Bankası Finansman Sistemi</p>

        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid #ddd', marginBottom: 24 }}>
          {(['customer', 'admin'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: tab === t ? '#1a237e' : '#f5f5f5',
                color: tab === t ? '#fff' : '#555',
              }}>
              {t === 'customer' ? '👤 Müşteri Girişi' : '🛡️ Admin Girişi'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Kullanıcı Adı</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              placeholder={tab === 'admin' ? 'admin' : 'kullanici_adi'} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              required />
          </div>
          {error && <p style={{ color: '#d32f2f', marginBottom: 12, fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, background: '#1a237e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        {tab === 'customer' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 13 }}>
            <Link to="/register" style={{ color: '#1a237e', textDecoration: 'none' }}>Kayıt Ol</Link>
            <Link to="/forgot-password" style={{ color: '#666', textDecoration: 'none' }}>Şifremi Unuttum</Link>
          </div>
        )}
      </div>
    </div>
  );
}
