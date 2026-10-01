/**
 * Spec-compliant, chunk-agnostic SSE parser.
 *
 * Proxies such as Cloudflare are free to re-frame a `text/event-stream`:
 * several events can land in a single chunk, a single event can be split in
 * the middle of a line (even between `\r` and `\n`), and line endings can be
 * rewritten. A parser that assumes "one chunk == one event" loses the
 * `event:` line and silently drops the message. This one keeps a rolling
 * buffer and only emits an event once its terminating blank line arrived, so
 * segmented and non-segmented packets behave identically.
 */

export interface SseEvent {
    /** Event type; `message` when the stream did not specify one. */
    event: string;
    /** Concatenated `data:` lines, without the trailing newline. */
    data: string;
    /** Last `id:` seen for this event, if any. */
    id?: string;
    /** Reconnection delay in ms requested via `retry:`, if any. */
    retry?: number;
}

const DEFAULT_EVENT_TYPE = 'message';
const KNOWN_FIELDS = new Set(['event', 'data', 'id', 'retry']);

export interface SseParser {
    /** Feed a chunk (bytes or text) and get back every complete event in it. */
    push(chunk: Uint8Array | ArrayBuffer | string): SseEvent[];
    /** Flush a trailing event that was never terminated by a blank line. */
    flush(): SseEvent[];
    /** Last `id:` observed, to be sent back as `Last-Event-ID` on reconnect. */
    lastEventId: string;
}

export function createSseParser(): SseParser {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let startOfStream = true;

    // Event being accumulated across lines (and possibly across chunks).
    let eventType = '';
    let dataLines: string[] = [];
    let eventId: string | undefined;
    let retry: number | undefined;

    const parser: SseParser = {
        lastEventId: '',
        push(chunk) {
            if (typeof chunk === 'string') {
                buffer += chunk;
            } else {
                const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                buffer += decoder.decode(bytes, { stream: true });
            }
            return drain(false);
        },
        flush() {
            buffer += decoder.decode();
            return drain(true);
        },
    };

    function drain(final: boolean): SseEvent[] {
        const events: SseEvent[] = [];

        if (startOfStream && buffer.length > 0) {
            // Strip the UTF-8 BOM some servers/proxies prepend.
            if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1);
            startOfStream = false;
        }

        for (;;) {
            const lf = buffer.indexOf('\n');
            const cr = buffer.indexOf('\r');

            let lineEnd = -1;
            let nextStart = -1;

            if (lf === -1 && cr === -1) break;

            if (cr !== -1 && (lf === -1 || cr < lf)) {
                // A lone `\r` at the very end may be the first half of a `\r\n`
                // split across two chunks: wait for more bytes before deciding.
                if (cr === buffer.length - 1 && !final) break;
                lineEnd = cr;
                nextStart = buffer[cr + 1] === '\n' ? cr + 2 : cr + 1;
            } else {
                lineEnd = lf;
                nextStart = lf + 1;
            }

            const line = buffer.slice(0, lineEnd);
            buffer = buffer.slice(nextStart);

            const event = handleLine(line);
            if (event) events.push(event);
        }

        if (final) {
            // The stream ended (or the proxy closed it) without the final blank
            // line: treat whatever is pending as a complete event instead of
            // throwing it away.
            if (buffer.length > 0) {
                const line = buffer;
                buffer = '';
                const event = handleLine(line);
                if (event) events.push(event);
            }
            const trailing = dispatch();
            if (trailing) events.push(trailing);
        }

        return events;
    }

    function handleLine(line: string): SseEvent | null {
        if (line === '') return dispatch();
        if (line.startsWith(':')) return null; // comment / keep-alive

        const colon = line.indexOf(':');
        let field: string;
        let value: string;

        if (colon === -1) {
            field = line;
            value = '';
        } else {
            field = line.slice(0, colon);
            value = line.slice(colon + 1);
            if (value.startsWith(' ')) value = value.slice(1);
        }

        if (!KNOWN_FIELDS.has(field)) {
            // Tolerate streams whose payload lines lost their `data:` prefix:
            // a bare JSON line is treated as data rather than ignored.
            const trimmed = line.trimStart();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                dataLines.push(line);
            }
            return null;
        }

        switch (field) {
            case 'event':
                eventType = value;
                break;
            case 'data':
                dataLines.push(value);
                break;
            case 'id':
                if (!value.includes('\u0000')) {
                    eventId = value;
                    parser.lastEventId = value;
                }
                break;
            case 'retry': {
                if (/^\d+$/.test(value)) retry = Number(value);
                break;
            }
        }

        return null;
    }

    function dispatch(): SseEvent | null {
        if (dataLines.length === 0 && eventType === '') {
            reset();
            return null;
        }

        const event: SseEvent = {
            event: eventType || DEFAULT_EVENT_TYPE,
            data: dataLines.join('\n'),
        };
        if (eventId !== undefined) event.id = eventId;
        if (retry !== undefined) event.retry = retry;

        reset();
        return event;
    }

    function reset() {
        eventType = '';
        dataLines = [];
        eventId = undefined;
        retry = undefined;
    }

    return parser;
}

/** Serialize an event back into canonical SSE wire format. */
export function serializeSseEvent(event: SseEvent): string {
    let out = '';
    if (event.id !== undefined) out += `id: ${event.id}\n`;
    if (event.retry !== undefined) out += `retry: ${event.retry}\n`;
    if (event.event && event.event !== DEFAULT_EVENT_TYPE) out += `event: ${event.event}\n`;
    for (const line of event.data.split('\n')) out += `data: ${line}\n`;
    return out + '\n';
}

/**
 * Best-effort event type.
 *
 * Normally this is just `event.event`, but when the type was not transmitted
 * (or the stream fell back to the default `message` type) we look for an
 * explicit type inside the JSON payload before giving up.
 */
export function resolveSseEventType(event: SseEvent): string {
    if (event.event && event.event !== DEFAULT_EVENT_TYPE) return event.event;

    const data = event.data.trimStart();
    if (!data.startsWith('{')) return event.event;

    try {
        const payload = JSON.parse(event.data);
        const type = payload?.event ?? payload?.type ?? payload?.eventType;
        if (typeof type === 'string' && type) return type;
    } catch {
        // Not JSON, or not JSON we understand: keep the transport-level type.
    }

    return event.event;
}
