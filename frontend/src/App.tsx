import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import CustomersPage from './pages/Customers/CustomersPage';
import CustomerDetailPage from './pages/Customers/CustomerDetailPage';
import LoansPage from './pages/Loans/LoansPage';
import LoanDetailPage from './pages/Loans/LoanDetailPage';
import PaymentsPage from './pages/Payments/PaymentsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={
            <ProtectedRoute><Layout><CustomersPage /></Layout></ProtectedRoute>
          } />
          <Route path="/customers/:id" element={
            <ProtectedRoute><Layout><CustomerDetailPage /></Layout></ProtectedRoute>
          } />
          <Route path="/loans" element={
            <ProtectedRoute><Layout><LoansPage /></Layout></ProtectedRoute>
          } />
          <Route path="/loans/:id" element={
            <ProtectedRoute><Layout><LoanDetailPage /></Layout></ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute><Layout><PaymentsPage /></Layout></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
