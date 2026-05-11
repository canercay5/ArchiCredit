import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Customer, CreateCustomerDto } from '../../types';
import { useAuth } from '../../context/AuthContext';

const emptyForm: CreateCustomerDto = {
  firstName: '', lastName: '', nationalId: '', email: '', phoneNumber: '', dateOfBirth: ''
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateCustomerDto>(emptyForm);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

  const load = async () => {
    const { data } = await api.get<Customer[]>('/customers');
    setCustomers(data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/customers', form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.title || 'Hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.title || 'Silinemedi');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Müşteriler</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={btnStyle('#1a237e')}>
            {showForm ? 'İptal' : '+ Yeni Müşteri'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Yeni Müşteri</h3>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {(['firstName', 'lastName', 'nationalId', 'email', 'phoneNumber'] as const).map(field => (
              <div key={field}>
                <label style={labelStyle}>{fieldLabel(field)}</label>
                <input style={inputStyle} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} required />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Doğum Tarihi</label>
              <input type="date" style={inputStyle} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button type="submit" style={btnStyle('#1a237e')}>Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <div style={cardStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['Ad Soyad', 'TC Kimlik', 'E-posta', 'Telefon', 'İşlemler'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}><Link to={`/customers/${c.id}`} style={{ color: '#1a237e' }}>{c.firstName} {c.lastName}</Link></td>
                <td style={tdStyle}>{c.nationalId}</td>
                <td style={tdStyle}>{c.email}</td>
                <td style={tdStyle}>{c.phoneNumber}</td>
                <td style={tdStyle}>
                  <Link to={`/customers/${c.id}`} style={{ ...btnStyle('#1565c0'), textDecoration: 'none', marginRight: 6 }}>Detay</Link>
                  {isAdmin && (
                    <button onClick={() => handleDelete(c.id)} style={btnStyle('#c62828')}>Sil</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Kayıtlı müşteri yok.</p>}
      </div>
    </div>
  );
}

const fieldLabel = (f: string) => ({
  firstName: 'Ad', lastName: 'Soyad', nationalId: 'TC Kimlik No',
  email: 'E-posta', phoneNumber: 'Telefon'
}[f] ?? f);

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none', padding: '6px 14px',
  borderRadius: 4, cursor: 'pointer', fontSize: 13
});
