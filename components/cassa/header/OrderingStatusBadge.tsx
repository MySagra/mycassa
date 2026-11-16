'use client';

import { Clock, Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { cn } from '@/lib/utils';

/** Stile comune dei "chip" informativi dell'header: stessa altezza e raggio dei pulsanti. */
export const headerChipClass =
    'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium select-none whitespace-nowrap';
export const headerChipCompactClass =
    'inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-medium select-none whitespace-nowrap';

/**
 * Stato degli ordini dalla web app clienti, secondo `settings.ordering`:
 * - OPEN: nessun badge (sempre aperto)
 * - SCHEDULE: verde negli orari, ambra fuori orario
 * - CLOSED: badge "ordini online chiusi"
 * La cassa può sempre inviare ordini in ogni modalità.
 */
export function OrderingStatusBadge({ compact = false }: { compact?: boolean }) {
    const { t } = useTranslation();
    const { ordering } = useSettings();

    if (ordering.mode === 'OPEN') return null;

    const hours = { opensAt: ordering.opensAt ?? '', closesAt: ordering.closesAt ?? '' };

    let tone: string;
    let Icon = Clock;
    let label: string;
    let tooltip: string;

    if (ordering.mode === 'CLOSED') {
        tone = 'text-destructive bg-destructive/10 border-destructive/30';
        Icon = Lock;
        label = t('ordering.badgeClosed');
        tooltip = t('ordering.tooltipClosed');
    } else if (ordering.isOutsideSchedule) {
        tone = 'text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/30';
        label = compact ? t('ordering.badgeOutsideShort') : t('ordering.badgeOutside', hours);
        tooltip = t('ordering.tooltipOutside', hours);
    } else {
        // In orario: su mobile non serve occupare spazio nell'header
        if (compact) return null;
        tone = 'text-green-600 dark:text-green-500 bg-green-500/10 border-green-500/30';
        Icon = Globe;
        label = t('ordering.badgeOpen', hours);
        tooltip = t('ordering.tooltipOpen', hours);
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className={cn(compact ? headerChipCompactClass : headerChipClass, tone)}
                >
                    <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                    {label}
                </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
        </Tooltip>
    );
}
