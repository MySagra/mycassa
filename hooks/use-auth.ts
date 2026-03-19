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

function readUserStorage(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mycassa_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Hook per leggere i dati utente autenticato dal localStorage.
 * Non effettua chiamate API: legge direttamente il valore impostato al login.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = readUserStorage();
    setUser(userData);
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
