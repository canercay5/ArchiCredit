import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Payment } from '../../types';
import { PaymentStatus } from '../../types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    api.get<Payment[]>('/payments').then(r => setPayments(r.data));
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Ödeme Geçmişi</h2>
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {['Taksit No', 'Tutar', 'Ödeme Tarihi', 'İşlem No', 'Durum', 'Kredi'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={td}>{p.installmentNumber}</td>
                <td style={td}>₺{p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                <td style={td}>{new Date(p.paymentDate).toLocaleDateString('tr-TR')}</td>
                <td style={td}><code style={{ fontSize: 12 }}>{p.transactionId || '-'}</code></td>
                <td style={td}>
                  <span style={{
                    background: p.status === PaymentStatus.Success ? '#e8f5e9' : '#ffebee',
                    color: p.status === PaymentStatus.Success ? '#2e7d32' : '#c62828',
                    padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
                  }}>
                    {p.statusName}
                  </span>
                </td>
                <td style={td}><Link to={`/loans/${p.loanId}`} style={{ color: '#1565c0' }}>Detay</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p style={{ textAlign: 'center', color: '#999' }}>Ödeme geçmişi yok.</p>}
      </div>
    </div>
  );
}

const card: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 13, fontWeight: 600 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };
