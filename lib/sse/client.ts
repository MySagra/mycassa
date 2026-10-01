import { createSseParser, type SseEvent } from './parser';

/**
 * Minimal SSE client built on `fetch` + the chunk-agnostic parser.
 *
 * Replaces `@microsoft/fetch-event-source`: same callback shape, but the
 * framing is done by our own parser so events survive whatever chunking an
 * intermediate proxy (Cloudflare, nginx, ...) applies to the stream.
 */
export interface SseSubscribeOptions {
    signal?: AbortSignal;
    headers?: Record<string, string>;
    /** Called for every successful response. Throw to stop retrying. */
    onOpen?: (response: Response) => void | Promise<void>;
    onEvent: (event: SseEvent) => void | Promise<void>;
    /** Called when the server closed the stream cleanly. */
    onClose?: () => void;
    /**
     * Called on any network/stream failure. Return a delay in ms to override
     * the backoff, or throw to stop retrying altogether.
     */
    onError?: (error: unknown) => number | void;
    /** First reconnection delay, doubled on each consecutive failure. */
    initialRetryDelay?: number;
    maxRetryDelay?: number;
}

export async function subscribeSse(url: string, options: SseSubscribeOptions): Promise<void> {
    const {
        signal,
        headers,
        onOpen,
        onEvent,
        onClose,
        onError,
        initialRetryDelay = 1000,
        maxRetryDelay = 30000,
    } = options;

    let retryDelay = initialRetryDelay;
    let lastEventId = '';

    while (!signal?.aborted) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    ...(lastEventId ? { 'Last-Event-ID': lastEventId } : {}),
                    ...headers,
                },
                cache: 'no-store',
                credentials: 'same-origin',
                signal,
            });

            await onOpen?.(response);

            if (!response.ok) {
                throw Object.assign(new Error(`SSE request failed with status ${response.status}`), {
                    status: response.status,
                });
            }
            if (!response.body) {
                throw new Error('SSE response has no readable body');
            }

            // Connected: reset the backoff for the next disconnection.
            retryDelay = initialRetryDelay;

            const parser = createSseParser();
            const reader = response.body.getReader();

            try {
                for (;;) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    for (const event of parser.push(value)) {
                        if (event.id) lastEventId = event.id;
                        if (event.retry) retryDelay = event.retry;
                        await onEvent(event);
                    }
                }
                for (const event of parser.flush()) {
                    if (event.id) lastEventId = event.id;
                    await onEvent(event);
                }
            } finally {
                reader.cancel().catch(() => { });
            }

            onClose?.();
        } catch (error) {
            if (signal?.aborted || isAbortError(error)) return;

            // `onError` throwing means "fatal, stop here".
            const override = onError?.(error);
            if (typeof override === 'number') retryDelay = override;
        }

        if (signal?.aborted) return;
        await delay(retryDelay, signal);
        retryDelay = Math.min(retryDelay * 2, maxRetryDelay);
    }
}

function isAbortError(error: unknown): boolean {
    return (
        error instanceof Error &&
        (error.name === 'AbortError' || error.message === 'BodyStreamBuffer was aborted')
    );
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        const timer = setTimeout(done, ms);
        signal?.addEventListener('abort', done, { once: true });
        function done() {
            clearTimeout(timer);
            signal?.removeEventListener('abort', done);
            resolve();
        }
    });
}
