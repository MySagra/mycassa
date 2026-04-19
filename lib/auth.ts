import { cookies } from 'next/headers';

export const COOKIE_STORE_NAME = 'mycassa_token'; // nome con cui viene salvato localmente
export const AUTH_COOKIE_NAME = 'mysagra_token';  // nome con cui viene inviato al backend

/**
 * Restituisce il token di autenticazione dal cookie HTTP-only.
 * Da usare solo in Server Components, Server Actions e Route Handlers.
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_STORE_NAME)?.value ?? null;
}
