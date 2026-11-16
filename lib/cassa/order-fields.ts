import type { AppSettings, FieldRequirement, TableInputType } from '@/lib/settings/types';

/**
 * Regole dei campi cliente/tavolo, derivate da `settings.orders`.
 * - customer/table: REQUIRED (obbligatorio), OPTIONAL (facoltativo), HIDDEN (nascosto)
 * - tableInputs: ['NUMBER'] solo numero, ['TEXT'] solo testo libero, entrambi = qualsiasi
 * - maxTables: numero massimo del tavolo (vale per i tavoli numerici), null = nessun limite
 */
export interface OrderFieldsConfig {
    customer: FieldMode;
    table: FieldMode;
    tableNumberOnly: boolean;
    tableTextOnly: boolean;
    maxTables: number | null;
}

export type FieldMode = 'REQUIRED' | 'OPTIONAL' | 'HIDDEN';

/** Valori inviati quando il campo è nascosto o lasciato vuoto. */
export const NO_CUSTOMER_VALUE = 'NO CUSTOMER';
export const NO_TABLE_VALUE = 'NO_TABLE_PRESET';
/** Valori speciali impostati dal pulsante "cliente di default": esenti dalla validazione. */
const SENTINEL_CUSTOMERS = new Set(['NO_CUSTOMER', NO_CUSTOMER_VALUE]);
const SENTINEL_TABLES = new Set(['NO_TABLE', NO_TABLE_VALUE]);

const CUSTOMER_MIN_LENGTH = 2;

function toMode(value: FieldRequirement | undefined, fallback: FieldMode): FieldMode {
    const upper = typeof value === 'string' ? value.toUpperCase() : '';
    if (upper === 'REQUIRED' || upper === 'OPTIONAL' || upper === 'HIDDEN') return upper;
    return fallback;
}

export function getOrderFieldsConfig(settings: AppSettings): OrderFieldsConfig {
    const orders = settings.settings.orders;
    const inputs = new Set<TableInputType>(
        (Array.isArray(orders.tableInputs) ? orders.tableInputs : []).map(i => String(i).toUpperCase()),
    );
    const hasNumber = inputs.has('NUMBER');
    const hasText = inputs.has('TEXT');
    const max = typeof orders.maxTables === 'number' && orders.maxTables > 0 ? Math.floor(orders.maxTables) : null;

    return {
        customer: toMode(orders.customer, 'REQUIRED'),
        table: toMode(orders.table, 'OPTIONAL'),
        tableNumberOnly: hasNumber && !hasText,
        tableTextOnly: hasText && !hasNumber,
        maxTables: max,
    };
}

const isNumeric = (value: string) => /^\d+$/.test(value);

/** Errore sul cliente o null. Il valore va già risolto con l'eventuale default. */
export function validateCustomer(value: string, config: OrderFieldsConfig): string | null {
    if (config.customer === 'HIDDEN') return null;
    const v = value.trim();
    if (!v) return config.customer === 'REQUIRED' ? 'Inserisci il nome del cliente' : null;
    if (SENTINEL_CUSTOMERS.has(v)) return null;
    if (config.customer === 'REQUIRED' && v.length < CUSTOMER_MIN_LENGTH) {
        return `Il nome del cliente deve contenere almeno ${CUSTOMER_MIN_LENGTH} caratteri`;
    }
    return null;
}

/** Errore sul tavolo o null. Il valore va già risolto con l'eventuale default. */
export function validateTable(value: string, config: OrderFieldsConfig): string | null {
    if (config.table === 'HIDDEN') return null;
    const v = value.trim();
    if (!v) return config.table === 'REQUIRED' ? 'Inserisci il numero del tavolo' : null;
    if (SENTINEL_TABLES.has(v)) return null;

    if (config.tableNumberOnly && !isNumeric(v)) {
        return 'Il tavolo deve essere un numero';
    }
    if (!config.tableTextOnly && isNumeric(v)) {
        const n = Number(v);
        if (n < 1) return 'Il numero del tavolo deve essere almeno 1';
        if (config.maxTables !== null && n > config.maxTables) {
            return `Il numero del tavolo non può superare ${config.maxTables}`;
        }
    }
    return null;
}

/** Valore del cliente da inviare al backend. */
export function customerToSend(value: string, config: OrderFieldsConfig): string {
    if (config.customer === 'HIDDEN') return NO_CUSTOMER_VALUE;
    return value.trim() ? value : NO_CUSTOMER_VALUE;
}

/** Valore del tavolo da inviare al backend. */
export function tableToSend(value: string, config: OrderFieldsConfig): string {
    if (config.table === 'HIDDEN') return NO_TABLE_VALUE;
    return value.trim() ? value.trim() : NO_TABLE_VALUE;
}
