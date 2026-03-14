import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Restituisce i dati dell'utente corrente leggendo il cookie mysagra_token.
 * Usato dai Client Components per conoscere l'identità dell'utente autenticato.
 */
export async function GET(request: NextRequest) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        'Cookie': `${AUTH_COOKIE_NAME}=${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const user = await response.json();
    return NextResponse.json(user);
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
