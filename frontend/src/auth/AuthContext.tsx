import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { AuthUser } from './auth.types';
import { AuthContext } from './auth-context';

let sessionRequest: Promise<{ user: AuthUser }> | null = null;

function isSupportedUser(user: AuthUser) {
  return user.role === 'ADMIN' || user.role === 'OWNER';
}

function getCurrentSession() {
  if (!sessionRequest) {
    sessionRequest = api
      .get<{ user: AuthUser }>('/auth/me')
      .finally(() => {
        sessionRequest = null;
      });
  }
  return sessionRequest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const handleUnauthorized = () => {
      if (active) setUser(null);
    };
    window.addEventListener('nautiflow:unauthorized', handleUnauthorized);

    getCurrentSession()
      .then(({ user: currentUser }) => {
        if (active) setUser(isSupportedUser(currentUser) ? currentUser : null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.removeEventListener('nautiflow:unauthorized', handleUnauthorized);
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await api.post<void>('/auth/logout', {});
    setUser(null);
  }

  async function registerOwner(formData: FormData) {
    await api.postForm<{ message: string }>('/auth/register/lanchero', formData);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, registerOwner, logout }}>
      {children}
    </AuthContext.Provider>
  );
}