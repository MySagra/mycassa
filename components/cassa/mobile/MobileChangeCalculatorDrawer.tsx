'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';

interface MobileChangeCalculatorDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    total: number;
    onApply: (amount: string) => void;
}

function getPresets(total: number): number[] {
    const seen = new Set<number>();
    [
        Math.ceil(total),
        Math.ceil(total / 5) * 5,
        Math.ceil(total / 10) * 10,
        Math.ceil(total / 20) * 20,
        Math.ceil(total / 50) * 50,
        100,
    ].forEach((v) => { if (v >= total) seen.add(v); });
    return Array.from(seen).sort((a, b) => a - b).slice(0, 5);
}

export function MobileChangeCalculatorDrawer({
    open,
    onOpenChange,
    total,
    onApply,
}: MobileChangeCalculatorDrawerProps) {
    const { t } = useTranslation();
    const [input, setInput] = useState('');

    const paid = parseFloat(input.replace(',', '.')) || 0;
    const change = paid - total;
    const presets = useMemo(() => getPresets(total), [total]);

    const handleDigit = (d: string) => {
        setInput((prev) => {
            if (d === '.' && prev.includes('.')) return prev;
            if (prev === '' && d === '.') return '0.';
            return prev + d;
        });
    };

    const handleDelete = () => setInput((prev) => prev.slice(0, -1));

    const handleClose = () => {
        setInput('');
        onOpenChange(false);
    };

    const handleApply = () => {
        if (paid > 0) onApply(paid.toFixed(2));
        handleClose();
    };

    return (
        <Drawer open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DrawerContent className="flex flex-col">
                <DrawerHeader className="pb-2 shrink-0">
                    <DrawerTitle>{t('mobile.changeCalculator.title')}</DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pb-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{t('mobile.changeCalculator.totalLabel')}</span>
                        <span className="font-semibold text-foreground">{total.toFixed(2)} €</span>
                    </div>

                    {/* Display */}
                    <div className="text-right border rounded-lg p-4 bg-muted/30 min-h-[4rem] flex items-center justify-end">
                        {input
                            ? <span className="text-3xl font-bold">{input} €</span>
                            : <span className="text-xl text-muted-foreground">0.00 €</span>
                        }
                    </div>

                    {/* Change */}
                    <div className="flex justify-between items-center">
                        <span className="text-base font-medium">{t('payment.change')}</span>
                        <span className={`text-2xl font-bold ${paid > 0 ? (change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                            {paid > 0 ? `${change.toFixed(2)} €` : '— €'}
                        </span>
                    </div>

                    {/* Preset banconote */}
                    <div className="grid grid-cols-5 gap-2">
                        {presets.map((p) => (
                            <Button
                                key={p}
                                variant={input === p.toString() ? 'default' : 'outline'}
                                className="cursor-pointer font-semibold text-sm"
                                onClick={() => setInput(p.toString())}
                            >
                                {p}€
                            </Button>
                        ))}
                    </div>

                    {/* Numpad */}
                    <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((d) => (
                            <Button
                                key={d}
                                variant="outline"
                                className="h-12 text-lg font-semibold cursor-pointer"
                                onClick={() => handleDigit(d)}
                            >
                                {d}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            className="h-12 cursor-pointer"
                            onClick={handleDelete}
                        >
                            <Delete className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-11 cursor-pointer" onClick={handleClose}>
                            {t('cartSidebar.cancel')}
                        </Button>
                        <Button
                            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 cursor-pointer"
                            disabled={paid <= 0}
                            onClick={handleApply}
                        >
                            {t('mobile.changeCalculator.applyButton')}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
