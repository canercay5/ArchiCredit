import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Customer, UpdateCustomerProfileDto } from '../types';

export default function ProfilePage() {
  const { auth } = useAuth();
  const customerId = auth?.customerId;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<UpdateCustomerProfileDto>({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!customerId) return;
    const { data } = await api.get<Customer>(`/customers/${customerId}`);
    setCustomer(data);
    setForm({ firstName: data.firstName, lastName: data.lastName, email: data.email, phoneNumber: data.phoneNumber, dateOfBirth: data.dateOfBirth.substring(0, 10) });
  };

  useEffect(() => { load(); }, [customerId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await api.put(`/customers/${customerId}/profile`, form);
      setSuccess(true);
      setEditMode(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.title || 'Güncelleme başarısız.');
    }
  };

  if (!customer) return <p style={{ padding: 24 }}>Yükleniyor...</p>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 20 }}>👤 Profilim</h2>

      {success && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>Profil bilgileriniz güncellendi.</div>}
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>{error}</div>}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Kişisel Bilgiler</h3>
          <button onClick={() => { setEditMode(!editMode); setSuccess(false); }} style={btnSecondary}>
            {editMode ? 'İptal' : 'Düzenle'}
          </button>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Ad</label><input style={inp} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
              <div><label style={lbl}>Soyad</label><input style={inp} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
              <div><label style={lbl}>E-posta</label><input type="email" style={inp} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div><label style={lbl}>Telefon</label><input style={inp} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} /></div>
              <div><label style={lbl}>Doğum Tarihi</label><input type="date" style={inp} value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} required /></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" style={btnPrimary}>Kaydet</button>
            </div>
          </form>
        ) : (
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Ad Soyad', `${customer.firstName} ${customer.lastName}`],
                ['TC Kimlik No', customer.nationalId + ' (değiştirilemez)'],
                ['E-posta', customer.email],
                ['Telefon', customer.phoneNumber || '-'],
                ['Doğum Tarihi', new Date(customer.dateOfBirth).toLocaleDateString('tr-TR')],
                ['Kayıt Tarihi', new Date(customer.createdAt).toLocaleDateString('tr-TR')],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px 0', color: '#666', width: 150, fontSize: 14 }}>{k}</td>
                  <td style={{ padding: '10px 0', fontWeight: 500, fontSize: 14 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const btnPrimary: React.CSSProperties = { background: '#1a237e', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const btnSecondary: React.CSSProperties = { background: '#f5f5f5', color: '#333', border: '1px solid #ddd', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 };
