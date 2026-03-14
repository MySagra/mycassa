'use client';

// SessionProvider non è più necessario: l'autenticazione avviene tramite
// il cookie HTTP-only mysagra_token e il hook useAuth.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
