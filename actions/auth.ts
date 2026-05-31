'use server';

import { cookies, headers } from 'next/headers';
import { AUTH_COOKIE_NAME, COOKIE_STORE_NAME, USER_COOKIE_NAME, signUserJwt } from '@/lib/auth';

/**
 * Login action: chiama l'API e il cookie mysagra_token viene impostato
 * automaticamente dal backend come HTTP-only cookie nella risposta.
 */
export async function login(username: string, password: string) {
  try {
    const userAgent = (await headers()).get('user-agent') ?? '';

    const response = await fetch(`${process.env.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      return { success: false, error: 'Credenziali non valide' };
    }

    const data = await response.json();
    const user = { ...data, id: data.userId ?? data.id };

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const cookieStore = await cookies();
      const tokenMatch = setCookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
      if (tokenMatch) {
        const tokenValue = tokenMatch[1];

        const FALLBACK_MAX_AGE = 60 * 60 * 12;
        let maxAge = FALLBACK_MAX_AGE;

        const maxAgeMatch = setCookieHeader.match(/[Mm]ax-[Aa]ge=(\d+)/);
        if (maxAgeMatch) {
          maxAge = parseInt(maxAgeMatch[1], 10);
        } else {
          const expiresMatch = setCookieHeader.match(/[Ee]xpires=([^;]+)/);
          if (expiresMatch) {
            const expiresMs = Date.parse(expiresMatch[1]);
            if (!isNaN(expiresMs)) {
              maxAge = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
            }
          }
        }

        cookieStore.set(COOKIE_STORE_NAME, tokenValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge,
        });

        const userJwt = await signUserJwt({ id: user.id, username: user.username, role: user.role });
        cookieStore.set(USER_COOKIE_NAME, userJwt, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge,
        });
      }
    }

    return { success: true };
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
    cookieStore.delete(USER_COOKIE_NAME);
  }

  return { success: true };
}
