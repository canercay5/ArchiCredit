import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Loan, Installment, Payment } from '../../types';
import { InstallmentStatus } from '../../types';

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<Payment | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    const [l, ins] = await Promise.all([
      api.get<Loan>(`/loans/${id}`),
      api.get<Installment[]>(`/loans/${id}/installments`)
    ]);
    setLoan(l.data);
    setInstallments(ins.data);
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handlePay = async (installment: Installment) => {
    setPayingId(installment.id);
    setError('');
    setPayResult(null);
    try {
      const { data } = await api.post<Payment>('/payments', {
        installmentId: installment.id,
        amount: installment.amount
      });
      setPayResult(data);
      load();
    } catch (err: any) {
      setError(err.response?.data?.title || 'Ödeme başarısız');
    } finally {
      setPayingId(null);
    }
  };

  if (!loan) return <p>Yükleniyor...</p>;

  const paidCount = installments.filter(i => i.status === InstallmentStatus.Paid).length;
  const totalPaid = installments.filter(i => i.status === InstallmentStatus.Paid).reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <Link to="/loans" style={{ color: '#1a237e' }}>← Krediler</Link>
        <span style={{ color: '#999' }}>/</span>
        <Link to={`/customers/${loan.customerId}`} style={{ color: '#1a237e' }}>{loan.customerName}</Link>
        <span style={{ color: '#999' }}>/</span>
        <span>{loan.loanTypeName}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0 }}>Kredi Bilgileri</h3>
          <table style={{ width: '100%' }}>
            <tbody>
              {[
                ['Kredi Türü', loan.loanTypeName],
                ['Anapara', `₺${loan.principalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                ['Yıllık Faiz', `%${loan.interestRate}`],
                ['Vade', `${loan.termMonths} ay`],
                ['Aylık Taksit', `₺${loan.monthlyInstallmentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                ['Toplam Geri Ödeme', `₺${loan.totalRepayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`],
                ['Başlangıç Tarihi', new Date(loan.startDate).toLocaleDateString('tr-TR')],
                ['Kredi Skoru', loan.creditScore.toString()],
                ['Durum', loan.statusName],
              ].map(([k, v]) => (
                <tr key={k}><td style={{ padding: '6px 0', color: '#666', width: 150 }}>{k}</td><td style={{ padding: '6px 0', fontWeight: 500 }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

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
      </div>

      {payResult && (
        <div style={{ ...card, background: payResult.status === 1 ? '#e8f5e9' : '#ffebee', borderLeft: `4px solid ${payResult.status === 1 ? '#2e7d32' : '#c62828'}` }}>
          {payResult.status === 1
            ? `✅ Ödeme başarılı! İşlem No: ${payResult.transactionId}`
            : `❌ Ödeme başarısız.`}
        </div>
      )}
      {error && <div style={{ ...card, background: '#ffebee', borderLeft: '4px solid #c62828', color: '#c62828' }}>{error}</div>}

      <div style={card}>
        <h3 style={{ marginTop: 0 }}>Taksit Planı</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['No', 'Tutar', 'Anapara', 'Faiz', 'Son Ödeme', 'Durum', 'Ödeme Tarihi', 'İşlem'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {installments.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid #eee', background: i.status === InstallmentStatus.Overdue ? '#fff8e1' : 'transparent' }}>
                <td style={td}>{i.installmentNumber}</td>
                <td style={td}>₺{i.amount.toFixed(2)}</td>
                <td style={td}>₺{i.principalPortion.toFixed(2)}</td>
                <td style={td}>₺{i.interestPortion.toFixed(2)}</td>
                <td style={td}>{new Date(i.dueDate).toLocaleDateString('tr-TR')}</td>
                <td style={td}><span style={badge(i.statusName)}>{i.statusName}</span></td>
                <td style={td}>{i.paidAt ? new Date(i.paidAt).toLocaleDateString('tr-TR') : '-'}</td>
                <td style={td}>
                  {i.status !== InstallmentStatus.Paid && (
                    <button
                      onClick={() => handlePay(i)}
                      disabled={payingId === i.id || loan.status === 2}
                      style={{ background: '#1a237e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      {payingId === i.id ? '...' : 'Öde'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const badge = (s: string): React.CSSProperties => ({
  background: s === 'Paid' ? '#e8f5e9' : s === 'Overdue' ? '#ffebee' : '#fff8e1',
  color: s === 'Paid' ? '#2e7d32' : s === 'Overdue' ? '#c62828' : '#e65100',
  padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
});
const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
