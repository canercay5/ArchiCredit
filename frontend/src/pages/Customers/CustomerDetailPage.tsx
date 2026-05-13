import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { parseApiError } from '../../utils/apiError';
import type { Customer, CustomerSummary, UpdateCustomerDto, Loan } from '../../types';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [form, setForm] = useState<UpdateCustomerDto>({ firstName: '', lastName: '', email: '', phoneNumber: '', dateOfBirth: '' });
  const { isAdmin } = useAuth();

  const load = async () => {
    const [c, s, l] = await Promise.all([
      api.get<Customer>(`/customers/${id}`),
      api.get<CustomerSummary>(`/customers/${id}/summary`),
      api.get<Loan[]>(`/customers/${id}/loans`)
    ]);
    setCustomer(c.data);
    setSummary(s.data);
    setLoans(l.data);
    setForm({ firstName: c.data.firstName, lastName: c.data.lastName, email: c.data.email, phoneNumber: c.data.phoneNumber, dateOfBirth: c.data.dateOfBirth.substring(0, 10) });
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    try {
      await api.put(`/customers/${id}`, form);
      setEditMode(false);
      load();
    } catch (err) {
      setUpdateError(parseApiError(err));
    }
  };

  if (!customer) return <p>Yükleniyor...</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <Link to="/customers" style={{ color: '#1a237e' }}>← Müşteriler</Link>
        <span style={{ color: '#999' }}>/</span>
        <span>{customer.firstName} {customer.lastName}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Müşteri Bilgileri</h3>
            {isAdmin && <button onClick={() => setEditMode(!editMode)} style={btn('#1565c0')}>{editMode ? 'İptal' : 'Düzenle'}</button>}
          </div>
          {editMode ? (
            <form onSubmit={handleUpdate}>
              {updateError && <p style={{ color: '#c62828', fontSize: 14, marginBottom: 10 }}>{updateError}</p>}
              {(['firstName', 'lastName', 'email', 'phoneNumber'] as const).map(f => (
                <div key={f} style={{ marginBottom: 10 }}>
                  <label style={lbl}>{fLabel(f)}</label>
                  <input style={inp} value={form[f]} onChange={e => setForm({ ...form, [f]: e.target.value })} />
                </div>
              ))}
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Doğum Tarihi</label>
                <input type="date" style={inp} value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <button type="submit" style={btn('#1a237e')}>Kaydet</button>
            </form>
          ) : (
            <table style={{ width: '100%' }}>
              <tbody>
                {[['TC Kimlik', customer.nationalId], ['E-posta', customer.email], ['Telefon', customer.phoneNumber], ['Doğum Tarihi', customer.dateOfBirth.substring(0, 10)], ['Kayıt Tarihi', new Date(customer.createdAt).toLocaleDateString('tr-TR')]].map(([k, v]) => (
                  <tr key={k}><td style={{ padding: '6px 0', color: '#666', width: 120 }}>{k}</td><td style={{ padding: '6px 0', fontWeight: 500 }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {summary && (
          <div style={card}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Borç Özeti</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Toplam Borç', `₺${summary.totalLoanDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#d32f2f'],
                ['Kalan Anapara', `₺${summary.remainingPrincipal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#1565c0'],
                ['Gecikmiş Taksit', summary.overdueInstallmentCount, '#e65100'],
                ['Ödenen / Ödenmeyen', `${summary.paidInstallmentCount} / ${summary.unpaidInstallmentCount}`, '#2e7d32'],
              ].map(([label, value, color]) => (
                <div key={label as string} style={{ background: '#f5f5f5', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: color as string }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Krediler</h3>
        </div>
        {loans.length === 0 ? <p style={{ color: '#999' }}>Kredi yok.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f0f0f0' }}>
              {['Tür', 'Tutar', 'Faiz', 'Vade', 'Aylık Taksit', 'Durum', 'İşlem'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{l.loanTypeName}</td>
                  <td style={td}>₺{l.principalAmount.toLocaleString('tr-TR')}</td>
                  <td style={td}>%{l.monthlyProfitRate}</td>
                  <td style={td}>{l.termMonths} ay</td>
                  <td style={td}>₺{l.monthlyInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td style={td}><span style={{ ...statusBadge(l.statusName) }}>{l.statusName}</span></td>
                  <td style={td}><Link to={`/loans/${l.id}`} style={{ color: '#1565c0' }}>Detay</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {summary && summary.unpaidInstallments.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Ödenmemiş Taksitler</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f0f0f0' }}>
              {['No', 'Tutar', 'Son Ödeme', 'Durum'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {summary.unpaidInstallments.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{i.installmentNumber}</td>
                  <td style={td}>₺{i.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  <td style={td}>{new Date(i.dueDate).toLocaleDateString('tr-TR')}</td>
                  <td style={td}><span style={statusBadge(i.statusName)}>{i.statusName}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const statusBadge = (s: string): React.CSSProperties => ({
  background: s === 'Active' || s === 'Paid' ? '#e8f5e9' : s === 'Overdue' ? '#ffebee' : '#fff8e1',
  color: s === 'Active' || s === 'Paid' ? '#2e7d32' : s === 'Overdue' ? '#c62828' : '#e65100',
  padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
});

const fLabel = (f: string) => ({ firstName: 'Ad', lastName: 'Soyad', email: 'E-posta', phoneNumber: 'Telefon' }[f] ?? f);
const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 });
const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box', marginBottom: 4 };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
