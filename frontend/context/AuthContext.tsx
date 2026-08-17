"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

if (typeof window !== 'undefined' && !(window as any).__fetch_intercepted__) {
  (window as any).__fetch_intercepted__ = true;
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    if ((url.startsWith('/api/') || url.startsWith('api/')) && 
        !url.includes('/api/auth/login') && 
        !url.includes('/api/auth/register') && 
        !url.includes('/api/auth/logout')) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const cleanUrl = url.startsWith('/') ? url : '/' + url;
      url = `${apiBase}${cleanUrl}`;
      
      init = init || {};
      const headers = new Headers(init.headers || {});
      
      const value = `; ${document.cookie}`;
      const parts = value.split(`; auth_token=`);
      const token = parts.length === 2 ? parts.pop()?.split(';').shift() : null;
      
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      init.headers = headers;
      
      if (typeof input !== 'string') {
        return originalFetch(url, init);
      }
    }
    return originalFetch(input || url, init);
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'MENTOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser: User | null }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async () => {
    await refreshUser();
    router.push('/dashboard');
    router.refresh();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
