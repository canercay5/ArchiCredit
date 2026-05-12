import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthResult } from '../types';

interface AuthContextType {
  auth: AuthResult | null;
  login: (result: AuthResult) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResult | null>(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('auth');
    if (token && raw) return JSON.parse(raw) as AuthResult;
    return null;
  });

  const login = (result: AuthResult) => {
    localStorage.setItem('token', result.token);
    localStorage.setItem('auth', JSON.stringify(result));
    setAuth(result);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAdmin: auth?.role === 'Admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
