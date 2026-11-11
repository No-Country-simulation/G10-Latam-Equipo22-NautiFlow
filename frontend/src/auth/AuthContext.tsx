import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError, api } from '../services/api';
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
  const [sessionError, setSessionError] = useState(false);
  const sessionEpochRef = useRef(0);

  const fetchSession = useCallback(async () => {
    const epoch = sessionEpochRef.current;
    try {
      const { user: currentUser } = await getCurrentSession();
      if (epoch !== sessionEpochRef.current) return;
      setUser(isSupportedUser(currentUser) ? currentUser : null);
      setSessionError(false);
    } catch (reason) {
      if (epoch !== sessionEpochRef.current) return;
      if (reason instanceof ApiError && reason.status === 401) {
        setUser(null);
        setSessionError(false);
      } else {
        console.error('No pudimos verificar la sesión:', reason);
        setSessionError(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const path = (event as CustomEvent<{ path?: string }>).detail?.path;
      if (path === '/auth/me') return;
      setUser(null);
      setSessionError(false);
    };
    window.addEventListener('nautiflow:unauthorized', handleUnauthorized);

    void fetchSession().finally(() => setLoading(false));

    return () => {
      window.removeEventListener('nautiflow:unauthorized', handleUnauthorized);
    };
  }, [fetchSession]);

  async function refreshSession() {
    sessionEpochRef.current += 1;
    setLoading(true);
    try {
      await fetchSession();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await api.post<{ user: AuthUser }>('/auth/login', { email, password });
    sessionEpochRef.current += 1;
    setUser(result.user);
    setSessionError(false);
    return result.user;
  }

  async function logout() {
    sessionEpochRef.current += 1;
    await api.post<void>('/auth/logout', {});
    setUser(null);
    setSessionError(false);
  }

  async function registerOwner(formData: FormData) {
    await api.postForm<{ message: string }>('/auth/register/lanchero', formData);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, sessionError, refreshSession, login, registerOwner, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
