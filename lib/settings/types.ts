/**
 * Impostazioni centralizzate restituite da `GET /v1/settings`
 * e inviate nell'evento SSE `settings-update`.
 */

export type FieldRequirement = 'REQUIRED' | 'OPTIONAL' | 'HIDDEN' | (string & {});
export type TableInputType = 'NUMBER' | 'TEXT' | (string & {});
/** OPEN: sempre aperto · SCHEDULE: aperto negli orari · CLOSED: ordini clienti chiusi */
export type OrderingMode = 'OPEN' | 'SCHEDULE' | 'CLOSED';

export interface AppSettings {
    sagra: {
        name: string;
        receiptLogo: string | null;
    };
    settings: {
        general: {
            timezone: string;
            currency: string;
        };
        orders: {
            customer: FieldRequirement;
            table: FieldRequirement;
            tableInputs: TableInputType[];
            maxTables: number | null;
        };
        tickets: {
            showNumbers: boolean;
        };
        ordering: {
            mode: OrderingMode;
            /** "HH:mm" nel fuso orario `general.timezone` */
            opensAt: string | null;
            /** "HH:mm"; se <= opensAt l'orario attraversa la mezzanotte */
            closesAt: string | null;
        };
        preparation: {
            syncCompletion: boolean;
        };
        stations: {
            pickupTickets: boolean;
        };
    };
    updatedAt: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
    sagra: { name: '', receiptLogo: null },
    settings: {
        general: { timezone: 'Europe/Rome', currency: 'EUR' },
        orders: { customer: 'REQUIRED', table: 'OPTIONAL', tableInputs: ['NUMBER', 'TEXT'], maxTables: null },
        tickets: { showNumbers: false },
        ordering: { mode: 'OPEN', opensAt: null, closesAt: null },
        preparation: { syncCompletion: false },
        stations: { pickupTickets: false },
    },
    updatedAt: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** "SCHEDULED" è accettato come alias di "SCHEDULE". */
function normalizeMode(mode: unknown): OrderingMode {
    const upper = typeof mode === 'string' ? mode.toUpperCase() : '';
    if (upper === 'SCHEDULE' || upper === 'SCHEDULED') return 'SCHEDULE';
    if (upper === 'CLOSED') return 'CLOSED';
    return 'OPEN';
}

/**
 * Unisce un payload (anche parziale o malformato) ai default, così il resto
 * dell'app può leggere ogni campo senza controlli.
 */
export function normalizeSettings(raw: unknown, base: AppSettings = DEFAULT_SETTINGS): AppSettings {
    if (!isObject(raw)) return base;

    const sagra = isObject(raw.sagra) ? raw.sagra : {};
    const s = isObject(raw.settings) ? raw.settings : {};
    const pick = <K extends keyof AppSettings['settings']>(key: K): AppSettings['settings'][K] => ({
        ...base.settings[key],
        ...(isObject(s[key]) ? s[key] : {}),
    });

    const ordering = pick('ordering');

    return {
        sagra: { ...base.sagra, ...sagra },
        settings: {
            general: pick('general'),
            orders: pick('orders'),
            tickets: pick('tickets'),
            ordering: { ...ordering, mode: normalizeMode(ordering.mode) },
            preparation: pick('preparation'),
            stations: pick('stations'),
        },
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : base.updatedAt,
    };
}
