import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

const TOKEN_KEY = 'mern_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return undefined;
    }

    api
      .getMe(token)
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function persistSession(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }

  async function login(credentials) {
    const data = await api.login(credentials);
    persistSession(data);
  }

  async function register(payload) {
    const data = await api.register(payload);
    persistSession(data);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
