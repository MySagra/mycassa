'use server';

import { auth } from '@/lib/auth';

/**
 * SSE Proxy for cashier events
 * This endpoint proxies SSE connections from the backend, keeping API_URL server-side only
 */
export async function GET(request: Request) {
    const session = await auth();

    if (!session?.accessToken) {
        return new Response('Unauthorized', { status: 401 });
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001';

    try {
        // Connect to the backend SSE endpoint
        const response = await fetch(`${apiUrl}/events/cashier`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'text/event-stream',
            },
        });

        if (!response.ok) {
            return new Response(`Backend error: ${response.status}`, {
                status: response.status
            });
        }

        // Return the SSE stream from backend to client
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('[SSE Proxy] Error:', error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
}
