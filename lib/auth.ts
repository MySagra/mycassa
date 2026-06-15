import { cookies } from 'next/headers';

export const COOKIE_STORE_NAME = 'mycassa_session';
export const AUTH_COOKIE_NAME = 'mysagra_session';
export const USER_COOKIE_NAME = 'mycassa_user';

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_STORE_NAME)?.value ?? null;
}

export async function signUserJwt(user: { id: string; username: string; role: string }): Promise<string> {
  const secret = process.env.JWT_SECRET ?? 'mycassa-fallback-secret';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${payload}`));
  const signature = Buffer.from(sig).toString('base64url');
  return `${header}.${payload}.${signature}`;
}
