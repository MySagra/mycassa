'use server';

import { signIn, signOut } from '@/lib/auth';
import { getBackendToken, BACKEND_COOKIE_NAME } from '@/lib/auth-token';

/**
 * Login action: delega a NextAuth (Credentials). NextAuth chiama il backend,
 * legge il cookie mysagra_session e crea la sessione cifrata `mycassa-session`
 * con scadenza allineata all'Expires del cookie backend.
 */
export async function login(username: string, password: string) {
  try {
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    // signIn con redirect:false ritorna undefined in caso di successo;
    // lancia un AuthError (CredentialsSignin) in caso di credenziali errate.
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      return { success: false, error: 'Credenziali non valide' };
    }

    return { success: true };
  } catch (error: unknown) {
    // NextAuth lancia un errore con `type` per credenziali non valide.
    if (error && typeof error === 'object' && 'type' in error) {
      return { success: false, error: 'Credenziali non valide' };
    }
    console.error('Login error:', error);
    return { success: false, error: 'Errore durante il login' };
  }
}

/**
 * Logout action: notifica il backend (best-effort) e distrugge la sessione NextAuth.
 */
export async function logout() {
  try {
    const token = await getBackendToken();
    if (token) {
      await fetch(`${process.env.API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${BACKEND_COOKIE_NAME}=${token}`,
        },
      }).catch(() => {
        // Logout locale avviene comunque.
      });
    }
  } catch {
    // Ignora errori backend.
  }

  await signOut({ redirect: false });
  return { success: true };
}
