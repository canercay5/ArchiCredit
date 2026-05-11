import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthResult } from '../types';

export default function LoginPage() {
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
      login(data);
      navigate('/customers');
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
        background: '#fff', borderRadius: 12, padding: 40, width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#1a237e', marginBottom: 8 }}>🏦 ArchiCredit</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>Dijital Kredi Yönetim Sistemi</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Kullanıcı Adı</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              placeholder="admin"
              required
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              required
            />
          </div>
          {error && <p style={{ color: '#d32f2f', marginBottom: 12, fontSize: 14 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: 12, background: '#1a237e', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 600
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
