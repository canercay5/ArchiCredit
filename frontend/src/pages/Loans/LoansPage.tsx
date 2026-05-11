import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Loan, CreateLoanDto, Customer } from '../../types';
import { LoanType } from '../../types';

const emptyForm = (): CreateLoanDto => ({
  customerId: '', loanType: LoanType.Personal, principalAmount: 0,
  interestRate: 0, termMonths: 12, startDate: new Date().toISOString().substring(0, 10)
});

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateLoanDto>(emptyForm());
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  const load = async () => {
    const [l, c] = await Promise.all([api.get<Loan[]>('/loans'), api.get<Customer[]>('/customers')]);
    setLoans(l.data);
    setCustomers(c.data);
  };

  useEffect(() => {
    load();
    const cid = searchParams.get('customerId');
    if (cid) { setForm(f => ({ ...f, customerId: cid })); setShowForm(true); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/loans', form);
      setForm(emptyForm());
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.title || JSON.stringify(err.response?.data));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Krediler</h2>
        <button onClick={() => setShowForm(!showForm)} style={btn('#1a237e')}>
          {showForm ? 'İptal' : '+ Yeni Kredi'}
        </button>
      </div>

      {showForm && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Yeni Kredi Başvurusu</h3>
          <p style={{ fontSize: 13, color: '#666', marginTop: -8, marginBottom: 16 }}>
            ⚠️ Kredi onayı için kredi skoru 600 ve üzeri olmalıdır.
          </p>
          {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Müşteri</label>
              <select style={inp} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} required>
                <option value="">-- Seçiniz --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Kredi Türü</label>
              <select style={inp} value={form.loanType} onChange={e => setForm({ ...form, loanType: +e.target.value as LoanType })}>
                <option value={LoanType.Personal}>İhtiyaç Kredisi</option>
                <option value={LoanType.Education}>Eğitim Kredisi</option>
                <option value={LoanType.Vehicle}>Taşıt Kredisi</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Anapara (₺)</label>
              <input type="number" style={inp} value={form.principalAmount} onChange={e => setForm({ ...form, principalAmount: +e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Yıllık Faiz Oranı (%)</label>
              <input type="number" step="0.01" style={inp} value={form.interestRate} onChange={e => setForm({ ...form, interestRate: +e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Vade (Ay)</label>
              <input type="number" style={inp} value={form.termMonths} onChange={e => setForm({ ...form, termMonths: +e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Başlangıç Tarihi</label>
              <input type="date" style={inp} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button type="submit" style={btn('#1a237e')}>Kredi Başvurusu Yap</button>
            </div>
          </form>
        </div>
      )}

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['Müşteri', 'Tür', 'Tutar', 'Faiz', 'Vade', 'Aylık Taksit', 'Kredi Skoru', 'Durum', 'İşlem'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}><Link to={`/customers/${l.customerId}`} style={{ color: '#1a237e' }}>{l.customerName}</Link></td>
                <td style={td}>{l.loanTypeName}</td>
                <td style={td}>₺{l.principalAmount.toLocaleString('tr-TR')}</td>
                <td style={td}>%{l.interestRate}</td>
                <td style={td}>{l.termMonths} ay</td>
                <td style={td}>₺{l.monthlyInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td style={td}><span style={{ color: l.creditScore >= 700 ? '#2e7d32' : '#e65100', fontWeight: 700 }}>{l.creditScore}</span></td>
                <td style={td}><span style={badge(l.statusName)}>{l.statusName}</span></td>
                <td style={td}><Link to={`/loans/${l.id}`} style={{ color: '#1565c0' }}>Detay</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loans.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Kayıtlı kredi yok.</p>}
      </div>
    </div>
  );
}

const badge = (s: string): React.CSSProperties => ({
  background: s === 'Active' ? '#e8f5e9' : '#f5f5f5',
  color: s === 'Active' ? '#2e7d32' : '#757575',
  padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
});
const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const btn = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 });
const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
