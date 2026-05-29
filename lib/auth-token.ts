import 'server-only';

import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { BACKEND_COOKIE_NAME, CLIENT_SESSION_COOKIE_NAME } from '@/lib/auth';

export { BACKEND_COOKIE_NAME };

/**
 * Legge il token backend `mysagra_session` decifrando la sessione NextAuth
 * (cookie `mycassa-session`). Da usare SOLO lato server (Server Actions,
 * Route Handlers): il token non viene mai esposto al client.
 */
export async function getBackendToken(): Promise<string | null> {
  const cookieStore = await cookies();

  // In produzione NextAuth può prefissare il cookie con __Secure-.
  const raw =
    cookieStore.get(CLIENT_SESSION_COOKIE_NAME)?.value ??
    cookieStore.get(`__Secure-${CLIENT_SESSION_COOKIE_NAME}`)?.value;

  if (!raw) return null;

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error('getBackendToken: AUTH_SECRET non configurato');
    return null;
  }

  try {
    // Il "salt" in Auth.js v5 coincide con il nome del cookie di sessione.
    const decoded = await decode({
      token: raw,
      secret,
      salt: CLIENT_SESSION_COOKIE_NAME,
    });
    return (decoded?.sessionToken as string | undefined) ?? null;
  } catch (error) {
    console.error('getBackendToken: impossibile decifrare la sessione', error);
    return null;
  }
}
