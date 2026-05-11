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

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export interface UpdateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export enum LoanType { Personal = 1, Education = 2, Vehicle = 3 }
export enum LoanStatus { Active = 1, Closed = 2 }
export enum InstallmentStatus { Unpaid = 1, Paid = 2, Overdue = 3 }
export enum PaymentStatus { Success = 1, Failed = 2 }

export interface Loan {
  id: string;
  customerId: string;
  customerName: string;
  loanType: LoanType;
  loanTypeName: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
  status: LoanStatus;
  statusName: string;
  creditScore: number;
  monthlyInstallmentAmount: number;
  totalRepayment: number;
  createdAt: string;
}

export interface CreateLoanDto {
  customerId: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  startDate: string;
}

export interface Installment {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  principalPortion: number;
  interestPortion: number;
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
