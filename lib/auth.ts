import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'mysagra_token';

/**
 * Restituisce il token di autenticazione dal cookie HTTP-only.
 * Da usare solo in Server Components, Server Actions e Route Handlers.
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
