'use client';

import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface UseAuthResult {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function readUserCookie(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)mycassa_user=([^;]*)/);
    if (!match) return null;
    const token = decodeURIComponent(match[1]);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode(parts[1])) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readUserCookie());
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
