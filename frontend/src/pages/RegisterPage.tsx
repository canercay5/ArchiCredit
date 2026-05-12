import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AuthResult, RegisterCustomerDto } from '../types';

const emptyForm = (): RegisterCustomerDto => ({
  firstName: '', lastName: '', nationalId: '', email: '',
  phoneNumber: '', dateOfBirth: '', username: '', password: ''
});

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterCustomerDto>(emptyForm());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field: keyof RegisterCustomerDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<AuthResult>('/auth/register-customer', form);
      login(data);
      navigate('/loans');
    } catch (err: any) {
      const msg = err.response?.data;
      setError(Array.isArray(msg) ? msg.join(' ') : msg?.title || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a237e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, width: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', color: '#1a237e', marginTop: 0 }}>🏦 Müşteri Kaydı</h2>

        {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <p style={{ fontWeight: 600, color: '#555', fontSize: 13, marginBottom: 8 }}>Kişisel Bilgiler</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div><label style={lbl}>Ad</label><input style={inp} value={form.firstName} onChange={set('firstName')} required /></div>
            <div><label style={lbl}>Soyad</label><input style={inp} value={form.lastName} onChange={set('lastName')} required /></div>
            <div><label style={lbl}>TC Kimlik No (11 hane)</label><input style={inp} maxLength={11} value={form.nationalId} onChange={set('nationalId')} required /></div>
            <div><label style={lbl}>E-posta</label><input type="email" style={inp} value={form.email} onChange={set('email')} required /></div>
            <div><label style={lbl}>Telefon</label><input style={inp} value={form.phoneNumber} onChange={set('phoneNumber')} /></div>
            <div><label style={lbl}>Doğum Tarihi</label><input type="date" style={inp} value={form.dateOfBirth} onChange={set('dateOfBirth')} required /></div>
          </div>

          <p style={{ fontWeight: 600, color: '#555', fontSize: 13, marginBottom: 8 }}>Giriş Bilgileri</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div><label style={lbl}>Kullanıcı Adı</label><input style={inp} value={form.username} onChange={set('username')} required /></div>
            <div><label style={lbl}>Şifre (min 6 karakter)</label><input type="password" style={inp} value={form.password} onChange={set('password')} required /></div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, background: '#1a237e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#666' }}>
          Zaten hesabınız var mı? <Link to="/login" style={{ color: '#1a237e' }}>Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
