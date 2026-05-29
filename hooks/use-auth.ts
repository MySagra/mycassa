'use client';

import { useSession } from 'next-auth/react';

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

/**
 * Hook per leggere l'utente autenticato dalla sessione NextAuth.
 * Sostituisce la precedente lettura da localStorage.
 */
export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession();

  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id,
        username: session.user.name ?? '',
        role: session.user.role ?? '',
      }
    : null;

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
