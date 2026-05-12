import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import type { ResetPasswordDto } from '../types';

export default function ForgotPasswordPage() {
  const [form, setForm] = useState<ResetPasswordDto>({ username: '', nationalId: '', newPassword: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: keyof ResetPasswordDto) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', form);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data;
      setError(Array.isArray(msg) ? msg.join(' ') : msg?.title || 'İşlem başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a237e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <h2 style={{ textAlign: 'center', color: '#1a237e', marginTop: 0 }}>🔑 Şifre Sıfırlama</h2>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#2e7d32', fontWeight: 600 }}>Şifreniz başarıyla güncellendi.</p>
            <Link to="/login" style={{ color: '#1a237e', fontWeight: 600 }}>Giriş Yap →</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              TC Kimlik numaranız ile kimliğiniz doğrulanacak ve yeni şifreniz ayarlanacak.
            </p>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Kullanıcı Adı</label>
              <input style={inp} value={form.username} onChange={set('username')} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>TC Kimlik No</label>
              <input style={inp} maxLength={11} value={form.nationalId} onChange={set('nationalId')} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Yeni Şifre (min 6 karakter)</label>
              <input type="password" style={inp} value={form.newPassword} onChange={set('newPassword')} required />
            </div>
            {error && <p style={{ color: '#d32f2f', fontSize: 14, marginBottom: 12 }}>{error}</p>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 12, background: '#1a237e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'İşleniyor...' : 'Şifremi Sıfırla'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
              <Link to="/login" style={{ color: '#666' }}>← Giriş Ekranına Dön</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
