import { getAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { createSseParser, serializeSseEvent } from '@/lib/sse';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

/** Sent upfront so intermediaries that buffer a minimum amount flush early. */
const INITIAL_PADDING = `:${' '.repeat(2048)}\n\n`;
/** Keep-alive comment interval, well under the usual 100s proxy idle timeout. */
const HEARTBEAT_MS = 15000;

/**
 * SSE Proxy for cashier events
 * This endpoint proxies SSE connections from the backend, keeping API_URL server-side only
 *
 * The upstream stream is re-framed through the SSE parser instead of being
 * piped raw: whatever chunking the backend (or an intermediary) used, the
 * client receives one canonical `event:`/`data:` frame per event.
 */
export async function GET(request: Request) {
    const token = await getAuthToken();

    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const lastEventId = request.headers.get('last-event-id');

    try {
        // Connect to the backend SSE endpoint
        const response = await fetch(`${apiUrl}/events/cashier`, {
            method: 'GET',
            headers: {
                'Cookie': `${AUTH_COOKIE_NAME}=${token}`,
                'Accept': 'text/event-stream',
                // No compression: a compressed stream gets buffered by proxies.
                'Accept-Encoding': 'identity',
                'Cache-Control': 'no-cache',
                ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
            },
            cache: 'no-store',
            signal: request.signal,
        });

        if (!response.ok || !response.body) {
            return new Response(`Backend error: ${response.status}`, {
                status: response.ok ? 502 : response.status
            });
        }

        const stream = normalizeSseStream(response.body, request.signal);

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream; charset=utf-8',
                // `no-transform` tells Cloudflare & co. not to buffer/recompress.
                'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
                'Connection': 'keep-alive',
                'Content-Encoding': 'identity',
                'X-Accel-Buffering': 'no',
            },
        });
    } catch (error: any) {
        if (request.signal.aborted) {
            return new Response(null, { status: 499 });
        }
        console.error('[SSE Proxy] Error:', error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
    }
}

/**
 * Re-emits the upstream stream as well-formed SSE frames, padded at the start
 * and kept alive with periodic comments.
 */
function normalizeSseStream(body: ReadableStream<Uint8Array>, signal: AbortSignal): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const parser = createSseParser();
    const reader = body.getReader();

    let heartbeat: ReturnType<typeof setInterval> | undefined;

    return new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(encoder.encode(INITIAL_PADDING));

            heartbeat = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(': keep-alive\n\n'));
                } catch {
                    // Controller already closed; the pull loop will clean up.
                }
            }, HEARTBEAT_MS);

            signal.addEventListener('abort', () => {
                reader.cancel().catch(() => { });
            }, { once: true });
        },
        async pull(controller) {
            try {
                const { done, value } = await reader.read();

                if (done) {
                    for (const event of parser.flush()) {
                        controller.enqueue(encoder.encode(serializeSseEvent(event)));
                    }
                    cleanup();
                    controller.close();
                    return;
                }

                for (const event of parser.push(value)) {
                    controller.enqueue(encoder.encode(serializeSseEvent(event)));
                }
            } catch (error) {
                cleanup();
                if (signal.aborted) {
                    controller.close();
                    return;
                }
                controller.error(error);
            }
        },
        cancel(reason) {
            cleanup();
            return reader.cancel(reason);
        },
    });

    function cleanup() {
        if (heartbeat) {
            clearInterval(heartbeat);
            heartbeat = undefined;
        }
    }
}
