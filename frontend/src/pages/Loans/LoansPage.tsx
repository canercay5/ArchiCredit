import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../utils/apiError';
import { computePreview } from '../../utils/loanCalculator';
import type { LoanPreview } from '../../utils/loanCalculator';
import type { Loan, CreateLoanDto } from '../../types';
import { LoanType, LoanStatus } from '../../types';

const emptyForm = (customerId = ''): CreateLoanDto => ({
  customerId, loanType: LoanType.Personal, principalAmount: 0, termMonths: 12,
  startDate: new Date().toISOString().substring(0, 10)
});

export default function LoansPage() {
  const { isAdmin, auth } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateLoanDto>(emptyForm());
  const [suggestedRate, setSuggestedRate] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const preview = useMemo<LoanPreview | null>(() => {
    if (suggestedRate === null || form.principalAmount <= 0) return null;
    return computePreview(form.principalAmount, suggestedRate, form.termMonths);
  }, [form.principalAmount, form.termMonths, suggestedRate]);

  const load = async () => {
    const { data } = await api.get<Loan[]>('/loans');
    setLoans(data);
  };

  const fetchRate = async (loanType: LoanType, termMonths: number) => {
    try {
      const { data } = await api.get<{ monthlyRate: number }>(`/profit-rates?loanType=${loanType}&termMonths=${termMonths}`);
      setSuggestedRate(data.monthlyRate);
    } catch { setSuggestedRate(null); }
  };

  useEffect(() => {
    if (!isAdmin && auth?.customerId) setForm(emptyForm(auth.customerId));
    load();
  }, []);

  useEffect(() => {
    if (!isAdmin) fetchRate(form.loanType, form.termMonths);
  }, [form.loanType, form.termMonths]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/loans', form);
      setForm(emptyForm(auth?.customerId ?? ''));
      setShowForm(false);
      setShowSchedule(false);
      load();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/loans/${id}/approve`, {});
      load();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/loans/${id}/reject`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      load();
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  const pendingLoans = loans.filter(l => l.status === LoanStatus.Pending);
  const otherLoans = loans.filter(l => l.status !== LoanStatus.Pending);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>{isAdmin ? 'Tüm Krediler' : 'Finansmanlarım'}</h2>
        {!isAdmin && (
          <button onClick={() => { setShowForm(!showForm); setShowSchedule(false); }} style={btnPrimary}>
            {showForm ? 'İptal' : '+ Yeni Başvuru'}
          </button>
        )}
      </div>

      {!isAdmin && showForm && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Finansman Başvurusu</h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Başvurunuz admin onayına gönderilecek. Kredi skoru 600 ve üzeri olmalıdır.
          </p>

          {error && <p style={{ color: '#c62828', fontSize: 14, marginBottom: 12 }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Finansman Türü</label>
                <select style={inp} value={form.loanType} onChange={e => setForm({ ...form, loanType: +e.target.value as LoanType })}>
                  <option value={LoanType.Personal}>İhtiyaç Finansmanı</option>
                  <option value={LoanType.Education}>Eğitim Finansmanı</option>
                  <option value={LoanType.Vehicle}>Taşıt Finansmanı</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Tutar (₺)</label>
                <input type="number" style={inp} value={form.principalAmount || ''} onChange={e => setForm({ ...form, principalAmount: +e.target.value })} required />
              </div>
              <div>
                <label style={lbl}>Vade (Ay)</label>
                <input type="number" style={inp} value={form.termMonths} onChange={e => setForm({ ...form, termMonths: +e.target.value })} required />
              </div>
              <div>
                <label style={lbl}>Başlangıç Tarihi</label>
                <input type="date" style={inp} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
              </div>
            </div>

            {preview && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                  {[
                    ['Aylık Kar Payı Oranı', `%${suggestedRate}`, '#1565c0'],
                    ['Aylık Taksit', `₺${preview.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#2e7d32'],
                    ['Toplam Geri Ödeme', `₺${preview.totalRepayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#e65100'],
                  ].map(([label, value, color]) => (
                    <div key={label} style={{ background: '#f5f5f5', borderRadius: 6, padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#666' }}>
                    Toplam kar payı maliyeti: <strong>₺{preview.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
                  </span>
                  <button type="button" onClick={() => setShowSchedule(s => !s)}
                    style={{ background: 'none', border: '1px solid #1a237e', color: '#1a237e', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                    {showSchedule ? 'Planı Gizle' : 'Taksit Planını Gör'}
                  </button>
                </div>

                {showSchedule && (
                  <div style={{ marginTop: 12, maxHeight: 320, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 6 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f0f4ff' }}>
                        <tr>
                          {['No', 'Taksit Tutarı', 'Anapara', 'Kar Payı', 'Kalan Bakiye'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #ddd' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.schedule.map(row => (
                          <tr key={row.no} style={{ borderBottom: '1px solid #f0f0f0', background: row.no % 2 === 0 ? '#fafafa' : '#fff' }}>
                            <td style={schedTd}>{row.no}</td>
                            <td style={schedTd}>₺{row.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td style={schedTd}>₺{row.principal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td style={{ ...schedTd, color: '#e65100' }}>₺{row.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                            <td style={schedTd}>₺{row.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <button type="submit" style={btnPrimary}>Başvuruyu Gönder</button>
          </form>
        </div>
      )}

      {isAdmin && pendingLoans.length > 0 && (
        <div style={{ ...card, borderLeft: '4px solid #f57c00' }}>
          <h3 style={{ marginTop: 0, color: '#e65100' }}>⏳ Onay Bekleyen Başvurular ({pendingLoans.length})</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fff8e1' }}>
                {['Müşteri', 'Tür', 'Tutar', 'Vade', 'Başvuru', 'İşlem'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {pendingLoans.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={td}>{l.customerName}</td>
                  <td style={td}>{loanTypeLabel(l.loanType)}</td>
                  <td style={td}>₺{l.principalAmount.toLocaleString('tr-TR')}</td>
                  <td style={td}>{l.termMonths} ay</td>
                  <td style={td}>{new Date(l.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprove(l.id)} style={{ ...btnSmall, background: '#2e7d32' }}>✓ Onayla</button>
                      <button onClick={() => setRejectId(l.id)} style={{ ...btnSmall, background: '#c62828' }}>✗ Reddet</button>
                      <Link to={`/loans/${l.id}`} style={{ ...btnSmall, background: '#1565c0', textDecoration: 'none', display: 'inline-block' }}>Detay</Link>
                    </div>
                    {rejectId === l.id && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <input placeholder="Red gerekçesi (opsiyonel)" value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13 }} />
                        <button onClick={() => handleReject(l.id)} style={{ ...btnSmall, background: '#c62828' }}>Gönder</button>
                        <button onClick={() => setRejectId(null)} style={{ ...btnSmall, background: '#757575' }}>İptal</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {[...(isAdmin ? ['Müşteri'] : []), 'Tür', 'Tutar', 'Aylık Kar Payı', 'Vade', 'Aylık Taksit', ...(isAdmin ? ['Kredi Skoru'] : []), 'Durum', 'İşlem'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(isAdmin ? otherLoans : loans).map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                {isAdmin && <td style={td}><Link to={`/customers/${l.customerId}`} style={{ color: '#1a237e' }}>{l.customerName}</Link></td>}
                <td style={td}>{loanTypeLabel(l.loanType)}</td>
                <td style={td}>₺{l.principalAmount.toLocaleString('tr-TR')}</td>
                <td style={td}>%{l.monthlyProfitRate}</td>
                <td style={td}>{l.termMonths} ay</td>
                <td style={td}>
                  {l.status === LoanStatus.Active || l.status === LoanStatus.Closed
                    ? `₺${l.monthlyInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                    : '-'}
                </td>
                {isAdmin && <td style={td}><span style={{ color: l.creditScore >= 700 ? '#2e7d32' : '#e65100', fontWeight: 700 }}>{l.creditScore || '-'}</span></td>}
                <td style={td}><span style={statusBadge(l.status)}>{statusLabel(l.status)}</span></td>
                <td style={td}><Link to={`/loans/${l.id}`} style={{ color: '#1565c0' }}>Detay</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loans.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: 16 }}>Kayıtlı finansman yok.</p>}
      </div>
    </div>
  );
}

function loanTypeLabel(t: LoanType) {
  return t === LoanType.Personal ? 'İhtiyaç' : t === LoanType.Education ? 'Eğitim' : 'Taşıt';
}

function statusLabel(s: LoanStatus) {
  return s === LoanStatus.Active ? 'Aktif' : s === LoanStatus.Closed ? 'Kapalı' : s === LoanStatus.Pending ? 'Onay Bekliyor' : 'Reddedildi';
}

function statusBadge(s: LoanStatus): React.CSSProperties {
  const map = {
    [LoanStatus.Active]:  { background: '#e8f5e9', color: '#2e7d32' },
    [LoanStatus.Closed]:  { background: '#f5f5f5', color: '#757575' },
    [LoanStatus.Pending]: { background: '#fff8e1', color: '#e65100' },
    [LoanStatus.Rejected]:{ background: '#ffebee', color: '#c62828' },
  };
  return { ...map[s], padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 };
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const btnPrimary: React.CSSProperties = { background: '#1a237e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const btnSmall: React.CSSProperties = { color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 };
const lbl: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600 };
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14, boxSizing: 'border-box' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
const schedTd: React.CSSProperties = { padding: '6px 10px', textAlign: 'right', fontSize: 13 };
