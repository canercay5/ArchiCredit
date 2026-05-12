import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { parseApiError } from '../../utils/apiError';
import type { Customer } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { isAdmin } = useAuth();

  const load = async () => {
    const { data } = await api.get<Customer[]>('/customers');
    setCustomers(data);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Müşteriyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      load();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Müşteriler</h2>
      </div>

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

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
const btnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none', padding: '6px 14px',
  borderRadius: 4, cursor: 'pointer', fontSize: 13
});
