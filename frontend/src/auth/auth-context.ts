import { createContext } from 'react';
import type { AuthUser } from './auth.types';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  registerOwner: (formData: FormData) => Promise<void>;
  registerClient: (details: { firstName: string; lastName: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);