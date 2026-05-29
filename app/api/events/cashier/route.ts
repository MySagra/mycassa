import { getBackendToken, BACKEND_COOKIE_NAME } from '@/lib/auth-token';

/**
 * SSE Proxy per gli eventi cassa.
 * Mantiene API_URL solo lato server e inietta il cookie mysagra_session
 * estratto dalla sessione NextAuth.
 */
export async function GET() {
  const token = await getBackendToken();

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/events/cashier`, {
      method: 'GET',
      headers: {
        Cookie: `${BACKEND_COOKIE_NAME}=${token}`,
        Accept: 'text/event-stream',
      },
    });

    if (!response.ok) {
      return new Response(`Backend error: ${response.status}`, {
        status: response.status,
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('[SSE Proxy] Error:', error);
    return new Response(`Proxy error: ${message}`, { status: 500 });
  }
}
