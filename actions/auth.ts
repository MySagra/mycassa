'use server';

import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, COOKIE_STORE_NAME } from '@/lib/auth';

/**
 * Login action: chiama l'API e il cookie mysagra_token viene impostato
 * automaticamente dal backend come HTTP-only cookie nella risposta.
 */
export async function login(username: string, password: string) {
  try {
    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      return { success: false, error: 'Credenziali non valide' };
    }

    // Il backend restituisce { id, username, role } e imposta il cookie mysagra_token
    // Propaghiamo il cookie Set-Cookie dalla risposta API al browser tramite Next.js
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parsiamo il cookie mysagra_token dal set-cookie header e lo reimpostiamo
      const cookieStore = await cookies();
      // Estrai il valore del token dal set-cookie header
      const tokenMatch = setCookieHeader.match(/mysagra_token=([^;]+)/);
      if (tokenMatch) {
        const tokenValue = tokenMatch[1];
        cookieStore.set(COOKIE_STORE_NAME, tokenValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 6, // 6 ore
        });
      }
    }

    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Errore durante il login' };
  }
}

/**
 * Logout action: rimuove il cookie mysagra_token lato client e
 * notifica il backend (se esposto un endpoint logout).
 */
export async function logout() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_STORE_NAME)?.value;

    // Tenta di notificare il backend del logout (opzionale)
    if (token) {
      await fetch(`${process.env.API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${AUTH_COOKIE_NAME}=${token}`,
        },
      }).catch(() => {
        // Ignora eventuali errori del backend, il logout locale avviene comunque
      });
    }
  } catch {
    // Ignora errori
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_STORE_NAME);
  }

  return { success: true };
}
