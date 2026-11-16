'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { cn } from '@/lib/utils';

function Colon() {
    return <span className="clock-blink" aria-hidden>:</span>;
}

/** Ora attuale nel fuso orario della sagra, stile orologio digitale con i due punti lampeggianti. */
export function HeaderClock({ className }: { className?: string }) {
    const { t } = useTranslation();
    const { timezone } = useSettings();
    const [now, setNow] = useState(() => new Date());

    // Tick allineato allo scoccare di ogni secondo
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const tick = () => {
            const date = new Date();
            setNow(date);
            timer = setTimeout(tick, 1000 - date.getMilliseconds());
        };
        timer = setTimeout(tick, 1000 - new Date().getMilliseconds());
        return () => clearTimeout(timer);
    }, []);

    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '--';

    return (
        <time
            dateTime={now.toISOString()}
            title={t('header.clockTooltip', { timezone })}
            className={cn('text-2xl font-semibold tabular-nums tracking-tight select-none', className)}
        >
            {get('hour')}<Colon />{get('minute')}<Colon />{get('second')}
        </time>
    );
}
