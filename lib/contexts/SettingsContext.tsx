'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSettings } from '@/actions/settings';
import { AppSettings, DEFAULT_SETTINGS, OrderingMode, normalizeSettings } from '@/lib/settings/types';

export interface OrderingStatus {
    mode: OrderingMode;
    opensAt: string | null;
    closesAt: string | null;
    /** true se, nell'ora attuale del fuso della sagra, gli ordini sono aperti. */
    isOpenNow: boolean;
    /** true quando la modalità è SCHEDULE e si è fuori dagli orari. */
    isOutsideSchedule: boolean;
}

interface SettingsContextType {
    settings: AppSettings;
    loaded: boolean;
    sagraName: string;
    timezone: string;
    currency: string;
    currencySymbol: string;
    ordering: OrderingStatus;
    /** Ricarica le impostazioni da `GET /v1/settings`. */
    reload: () => Promise<void>;
    /** Applica un payload ricevuto (es. evento SSE `settings-update`). */
    applySettings: (raw: unknown) => void;
    formatPrice: (value: number | string | null | undefined) => string;
    formatDateTime: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/** Ricontrolla l'orario ogni 30s per aggiornare lo stato aperto/chiuso. */
const CLOCK_TICK_MS = 30_000;

function toLocale(language: string | undefined): string {
    if (!language) return 'it-IT';
    if (language.startsWith('it')) return 'it-IT';
    if (language.startsWith('en')) return 'en-GB';
    return language;
}

function isValidTimeZone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

function parseHHmm(value: string | null): number | null {
    if (!value) return null;
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
}

/** Minuti trascorsi dalla mezzanotte nel fuso indicato. */
function minutesNowIn(timeZone: string, now: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const hour = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
}

/** Finestra [opensAt, closesAt); se closesAt <= opensAt attraversa la mezzanotte. */
export function isWithinSchedule(opensAt: string | null, closesAt: string | null, timeZone: string, now: Date): boolean {
    const open = parseHHmm(opensAt);
    const close = parseHHmm(closesAt);
    if (open === null || close === null) return true;
    if (open === close) return true;
    const current = minutesNowIn(timeZone, now);
    return open < close
        ? current >= open && current < close
        : current >= open || current < close;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const { i18n } = useTranslation();
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);
    const [now, setNow] = useState(() => new Date());
    const latestUpdateRef = useRef<string | null>(null);

    const applySettings = useCallback((raw: unknown) => {
        setSettings(prev => {
            const next = normalizeSettings(raw);
            // Ignora payload più vecchi di quello già applicato (fetch e SSE possono incrociarsi).
            if (next.updatedAt && latestUpdateRef.current && next.updatedAt < latestUpdateRef.current) {
                return prev;
            }
            latestUpdateRef.current = next.updatedAt ?? latestUpdateRef.current;
            return next;
        });
        setLoaded(true);
    }, []);

    const reload = useCallback(async () => {
        const result = await getSettings();
        if (result.success) {
            applySettings(result.data);
        } else if (result.status !== 401 && result.status !== 403) {
            console.error('[Settings] Errore caricamento impostazioni:', result.error);
        }
    }, [applySettings]);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
        return () => clearInterval(id);
    }, []);

    const locale = toLocale(i18n.language);
    const rawTz = settings.settings.general.timezone;
    const timezone = rawTz && isValidTimeZone(rawTz) ? rawTz : DEFAULT_SETTINGS.settings.general.timezone;
    const currency = settings.settings.general.currency || DEFAULT_SETTINGS.settings.general.currency;
    const sagraName = settings.sagra.name ?? '';

    const priceFormatter = useMemo(() => {
        try {
            return new Intl.NumberFormat(locale, { style: 'currency', currency });
        } catch {
            return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
        }
    }, [locale, currency]);

    const currencySymbol = useMemo(
        () => priceFormatter.formatToParts(0).find(p => p.type === 'currency')?.value ?? currency,
        [priceFormatter, currency],
    );

    const formatPrice = useCallback((value: number | string | null | undefined) => {
        const num = typeof value === 'number' ? value : parseFloat(value ?? '0');
        return priceFormatter.format(Number.isFinite(num) ? num : 0);
    }, [priceFormatter]);

    const formatDateTime = useCallback((date: string | Date, options?: Intl.DateTimeFormatOptions) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            ...options,
            timeZone: timezone,
        });
    }, [locale, timezone]);

    const ordering = useMemo<OrderingStatus>(() => {
        const { mode, opensAt, closesAt } = settings.settings.ordering;
        const isOpenNow = mode === 'OPEN'
            || (mode === 'SCHEDULE' && isWithinSchedule(opensAt, closesAt, timezone, now));
        return {
            mode,
            opensAt,
            closesAt,
            isOpenNow,
            isOutsideSchedule: mode === 'SCHEDULE' && !isOpenNow,
        };
    }, [settings.settings.ordering, timezone, now]);

    const value = useMemo<SettingsContextType>(() => ({
        settings,
        loaded,
        sagraName,
        timezone,
        currency,
        currencySymbol,
        ordering,
        reload,
        applySettings,
        formatPrice,
        formatDateTime,
    }), [settings, loaded, sagraName, timezone, currency, currencySymbol, ordering, reload, applySettings, formatPrice, formatDateTime]);

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}
