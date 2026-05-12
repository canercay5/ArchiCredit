import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { parseApiError } from '../../utils/apiError';
import { computePreview } from '../../utils/loanCalculator';
import type { Loan, Installment, Payment } from '../../types';
import { InstallmentStatus, LoanStatus } from '../../types';

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [showPreviewSchedule, setShowPreviewSchedule] = useState(false);

  const load = async () => {
    const lRes = await api.get<Loan>(`/loans/${id}`);
    setLoan(lRes.data);
    if (lRes.data.status === LoanStatus.Active || lRes.data.status === LoanStatus.Closed) {
      const iRes = await api.get<Installment[]>(`/loans/${id}/installments`);
      setInstallments(iRes.data);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const preview = useMemo(() => {
    if (!loan || loan.status !== LoanStatus.Pending) return null;
    return computePreview(loan.principalAmount, loan.monthlyProfitRate, loan.termMonths);
  }, [loan]);

  const handlePay = async (installment: Installment) => {
    setPayingId(installment.id);
    setError('');
    setPayResult(null);
    try {
      const { data } = await api.post<Payment>('/payments', { installmentId: installment.id, amount: installment.amount });
      setPayResult(data);
      load();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setPayingId(null);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/loans/${id}/approve`, {});
      load();
    } catch (err) { setError(parseApiError(err)); }
  };

  const handleReject = async () => {
    try {
      await api.post(`/loans/${id}/reject`, { reason: rejectReason });
      setShowReject(false);
      load();
    } catch (err) { setError(parseApiError(err)); }
  };

  if (!loan) return <p>Yükleniyor...</p>;

  const paidCount = installments.filter(i => i.status === InstallmentStatus.Paid).length;
  const totalPaid = installments.filter(i => i.status === InstallmentStatus.Paid).reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <Link to="/loans" style={{ color: '#1a237e' }}>← {isAdmin ? 'Krediler' : 'Finansmanlarım'}</Link>
        {isAdmin && <><span style={{ color: '#999' }}>/</span><Link to={`/customers/${loan.customerId}`} style={{ color: '#1a237e' }}>{loan.customerName}</Link></>}
      </div>

      {loan.status === LoanStatus.Pending && (
        <div style={{ ...card, borderLeft: '4px solid #f57c00', background: '#fff8e1' }}>
          {isAdmin ? (
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#e65100', marginBottom: 12 }}>⏳ Bu başvuru onay bekliyor.</p>
              {error && <p style={{ color: '#c62828', fontSize: 14 }}>{error}</p>}

              {preview && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
                    {[
                      ['Aylık Kar Payı Oranı', `%${loan!.monthlyProfitRate}`, '#1565c0'],
                      ['Aylık Taksit', `₺${preview.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#2e7d32'],
                      ['Toplam Geri Ödeme', `₺${preview.totalRepayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#e65100'],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{ background: '#fff3e0', borderRadius: 6, padding: '10px 14px' }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>
                      Toplam kar payı maliyeti: <strong>₺{preview.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                    <button type="button" onClick={() => setShowPreviewSchedule(s => !s)}
                      style={{ background: 'none', border: '1px solid #e65100', color: '#e65100', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
                      {showPreviewSchedule ? 'Planı Gizle' : 'Taksit Planını Gör'}
                    </button>
                  </div>
                  {showPreviewSchedule && (
                    <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 6, marginBottom: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#fff3e0' }}>
                          <tr>
                            {['No', 'Taksit Tutarı', 'Anapara', 'Kar Payı', 'Kalan Bakiye'].map(h => (
                              <th key={h} style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, borderBottom: '1px solid #ddd' }}>{h}</th>
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

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={handleApprove} style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>✓ Başvuruyu Onayla</button>
                <button onClick={() => setShowReject(!showReject)} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>✗ Reddet</button>
              </div>
              {showReject && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <input placeholder="Red gerekçesi (opsiyonel)" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }} />
                  <button onClick={handleReject} style={{ background: '#c62828', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 4, cursor: 'pointer' }}>Reddet</button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#e65100', fontWeight: 600 }}>⏳ Başvurunuz değerlendirme aşamasındadır.</p>
          )}
        </div>
      )}

      {loan.status === LoanStatus.Rejected && (
        <div style={{ ...card, borderLeft: '4px solid #c62828', background: '#ffebee' }}>
          <p style={{ margin: 0, color: '#c62828', fontWeight: 600 }}>✗ Bu başvuru reddedildi.</p>
          {loan.rejectionReason && <p style={{ margin: '8px 0 0', color: '#c62828', fontSize: 14 }}>Gerekçe: {loan.rejectionReason}</p>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Finansman Bilgileri</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Tür', loanTypeLabel(loan.loanType)],
                ['Anapara', `₺${loan.principalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                ['Aylık Kar Payı Oranı', `%${loan.monthlyProfitRate}`],
                ['Vade', `${loan.termMonths} ay`],
                ...(loan.status === LoanStatus.Active || loan.status === LoanStatus.Closed ? [
                  ['Aylık Taksit', `₺${loan.monthlyInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                  ['Toplam Geri Ödeme', `₺${loan.totalRepayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                ] : []),
                ['Başlangıç Tarihi', new Date(loan.startDate).toLocaleDateString('tr-TR')],
                ...(isAdmin && loan.creditScore ? [['Kredi Skoru', loan.creditScore.toString()]] : []),
                ['Durum', statusLabel(loan.status)],
              ].map(([k, v]) => (
                <tr key={k}><td style={{ padding: '6px 0', color: '#666', width: 170, fontSize: 14 }}>{k}</td><td style={{ padding: '6px 0', fontWeight: 500, fontSize: 14 }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {(loan.status === LoanStatus.Active || loan.status === LoanStatus.Closed) && (
          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Ödeme Özeti</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Toplam Taksit', installments.length, '#1565c0'],
                ['Ödenen', paidCount, '#2e7d32'],
                ['Kalan', installments.length - paidCount, '#e65100'],
                ['Ödenen Tutar', `₺${totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, '#1a237e'],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ background: '#f5f5f5', borderRadius: 6, padding: '12px 16px' }}>
                  <div style={{ fontSize: 12, color: '#666' }}>{l}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c as string }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {payResult && (
        <div style={{ ...card, background: payResult.status === 1 ? '#e8f5e9' : '#ffebee', borderLeft: `4px solid ${payResult.status === 1 ? '#2e7d32' : '#c62828'}` }}>
          {payResult.status === 1 ? `✅ Ödeme başarılı! İşlem No: ${payResult.transactionId}` : `❌ Ödeme başarısız.`}
        </div>
      )}
      {error && !showReject && <div style={{ ...card, background: '#ffebee', borderLeft: '4px solid #c62828', color: '#c62828' }}>{error}</div>}

      {installments.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Taksit Planı</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                {['No', 'Tutar', 'Anapara', 'Kar Payı', 'Son Ödeme', 'Durum', 'Ödeme Tarihi', 'İşlem'].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {installments.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid #eee', background: i.status === InstallmentStatus.Overdue ? '#fff8e1' : 'transparent' }}>
                  <td style={td}>{i.installmentNumber}</td>
                  <td style={td}>₺{i.amount.toFixed(2)}</td>
                  <td style={td}>₺{i.principalPortion.toFixed(2)}</td>
                  <td style={td}>₺{i.profitPortion.toFixed(2)}</td>
                  <td style={td}>{new Date(i.dueDate).toLocaleDateString('tr-TR')}</td>
                  <td style={td}><span style={installmentBadge(i.statusName)}>{installmentStatusLabel(i.statusName)}</span></td>
                  <td style={td}>{i.paidAt ? new Date(i.paidAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td style={td}>
                    {i.status !== InstallmentStatus.Paid && loan.status === LoanStatus.Active && (
                      <button onClick={() => handlePay(i)} disabled={payingId === i.id}
                        style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>
                        {payingId === i.id ? '...' : 'Öde'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function loanTypeLabel(t: number) {
  return t === 1 ? 'İhtiyaç Finansmanı' : t === 2 ? 'Eğitim Finansmanı' : 'Taşıt Finansmanı';
}
function statusLabel(s: LoanStatus) {
  return s === LoanStatus.Active ? 'Aktif' : s === LoanStatus.Closed ? 'Kapalı' : s === LoanStatus.Pending ? 'Onay Bekliyor' : 'Reddedildi';
}
function installmentStatusLabel(s: string) {
  return s === 'Paid' ? 'Ödendi' : s === 'Overdue' ? 'Gecikmiş' : 'Ödenmedi';
}

const installmentBadge = (s: string): React.CSSProperties => ({
  background: s === 'Paid' ? '#e8f5e9' : s === 'Overdue' ? '#ffebee' : '#fff8e1',
  color: s === 'Paid' ? '#2e7d32' : s === 'Overdue' ? '#c62828' : '#e65100',
  padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
});
const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
const schedTd: React.CSSProperties = { padding: '6px 10px', textAlign: 'right', fontSize: 13 };
