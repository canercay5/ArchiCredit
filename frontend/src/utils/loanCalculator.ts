export interface ScheduleRow {
  no: number;
  amount: number;
  principal: number;
  profit: number;
  balance: number;
}

export interface LoanPreview {
  monthlyPayment: number;
  totalRepayment: number;
  totalProfit: number;
  schedule: ScheduleRow[];
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function computePreview(
  principal: number,
  monthlyRate: number,
  termMonths: number,
): LoanPreview | null {
  if (principal <= 0 || termMonths <= 0 || monthlyRate < 0) return null;

  const r = monthlyRate / 100;
  const A = r === 0
    ? principal / termMonths
    : principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);

  const schedule: ScheduleRow[] = [];
  let remaining = principal;
  for (let i = 1; i <= termMonths; i++) {
    const profit = remaining * r;
    const principalPart = A - profit;
    remaining -= principalPart;
    schedule.push({
      no: i,
      amount: round2(A),
      principal: round2(principalPart),
      profit: round2(profit),
      balance: round2(Math.max(0, remaining)),
    });
  }

  return {
    monthlyPayment: round2(A),
    totalRepayment: round2(A * termMonths),
    totalProfit: round2(A * termMonths - principal),
    schedule,
  };
}
