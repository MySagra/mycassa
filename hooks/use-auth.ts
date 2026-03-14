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

const USER_COOKIE_NAME = 'mysagra_user';

function readUserCookie(): AuthUser | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${USER_COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

/**
 * Hook per leggere i dati utente autenticato dal cookie mysagra_user.
 * Non effettua chiamate API: legge direttamente il cookie impostato al login.
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = readUserCookie();
    setUser(userData);
    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
