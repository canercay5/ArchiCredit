export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  createdAt: string;
}

export interface UpdateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export interface UpdateCustomerProfileDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export const LoanType = { Personal: 1, Education: 2, Vehicle: 3 } as const;
export type LoanType = (typeof LoanType)[keyof typeof LoanType];

export const LoanStatus = { Active: 1, Closed: 2, Pending: 3, Rejected: 4 } as const;
export type LoanStatus = (typeof LoanStatus)[keyof typeof LoanStatus];

export const InstallmentStatus = { Unpaid: 1, Paid: 2, Overdue: 3 } as const;
export type InstallmentStatus = (typeof InstallmentStatus)[keyof typeof InstallmentStatus];

export const PaymentStatus = { Success: 1, Failed: 2 } as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  loanType: LoanType;
  loanTypeName: string;
  principalAmount: number;
  monthlyProfitRate: number;
  termMonths: number;
  startDate: string;
  status: LoanStatus;
  statusName: string;
  creditScore: number;
  monthlyInstallmentAmount: number;
  totalRepayment: number;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export interface CreateLoanDto {
  customerId: string;
  loanType: LoanType;
  principalAmount: number;
  termMonths: number;
  startDate: string;
}

export interface RegisterCustomerDto {
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  username: string;
  password: string;
}

export interface ResetPasswordDto {
  username: string;
  nationalId: string;
  newPassword: string;
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  principalPortion: number;
  profitPortion: number;
  dueDate: string;
  status: InstallmentStatus;
  statusName: string;
  paidAt: string | null;
}

export interface Payment {
  id: string;
  installmentId: string;
  installmentNumber: number;
  loanId: string;
  amount: number;
  paymentDate: string;
  transactionId: string;
  status: PaymentStatus;
  statusName: string;
}

export interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalLoanDebt: number;
  remainingPrincipal: number;
  overdueInstallmentCount: number;
  paidInstallmentCount: number;
  unpaidInstallmentCount: number;
  paidInstallments: Installment[];
  unpaidInstallments: Installment[];
}

export interface AuthResult {
  token: string;
  username: string;
  role: string;
  customerId: string | null;
}
