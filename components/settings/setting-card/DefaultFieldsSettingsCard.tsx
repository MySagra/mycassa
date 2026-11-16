"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { getOrderFieldsConfig, validateCustomer, validateTable } from '@/lib/cassa/order-fields';

export function DefaultFieldsSettingsCard() {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const fields = getOrderFieldsConfig(settings);
    // Il valore predefinito serve solo per i campi visibili in cassa
    const showCustomer = fields.customer !== 'HIDDEN';
    const showTable = fields.table !== 'HIDDEN';
    // Un valore predefinito vuoto non ha senso: lo trattiamo come obbligatorio
    const strictFields = { ...fields, customer: 'REQUIRED' as const, table: 'REQUIRED' as const };
    const [customerEnabled, setCustomerEnabled] = useState(false);
    const [customerValue, setCustomerValue] = useState('');
    const [customerError, setCustomerError] = useState<string | null>(null);
    const [tableEnabled, setTableEnabled] = useState(false);
    const [tableValue, setTableValue] = useState('');
    const [tableError, setTableError] = useState<string | null>(null);

    useEffect(() => {
        setCustomerEnabled(localStorage.getItem('defaultCustomerEnabled') === 'true');
        setCustomerValue(localStorage.getItem('defaultCustomerValue') ?? '');
        setTableEnabled(localStorage.getItem('defaultTableEnabled') === 'true');
        setTableValue(localStorage.getItem('defaultTableValue') ?? '');
    }, []);

    const handleSave = () => {
        let valid = true;

        if (customerEnabled) {
            const error = validateCustomer(customerValue, strictFields);
            if (error) {
                setCustomerError(error);
                valid = false;
            } else {
                setCustomerError(null);
            }
        } else {
            setCustomerError(null);
        }

        if (tableEnabled) {
            const error = validateTable(tableValue, strictFields);
            if (error) {
                setTableError(error);
                valid = false;
            } else {
                setTableError(null);
            }
        } else {
            setTableError(null);
        }

        if (!valid) return;

        localStorage.setItem('defaultCustomerEnabled', String(customerEnabled));
        localStorage.setItem('defaultCustomerValue', customerValue);
        localStorage.setItem('defaultTableEnabled', String(tableEnabled));
        localStorage.setItem('defaultTableValue', tableValue);
        toast.success(t('settings.printers.toastSaved'));
    };

    if (!showCustomer && !showTable) return null;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 select-none">
                    <Settings2 className="h-5 w-5 text-amber-600" />
                    <CardTitle>{t('settings.defaults.title')}</CardTitle>
                </div>
                <CardDescription className="select-none">
                    {t('settings.defaults.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {showCustomer && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="defaultCustomerEnabled"
                                checked={customerEnabled}
                                onCheckedChange={(checked) => {
                                    setCustomerEnabled(checked === true);
                                    setCustomerError(null);
                                }}
                            />
                            <Label htmlFor="defaultCustomerEnabled" className="cursor-pointer select-none">
                                {t('settings.defaults.customerLabel')}
                            </Label>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Input
                                className={`w-55 ${customerError ? 'border-destructive' : ''}`}
                                placeholder={t('settings.defaults.customerPlaceholder')}
                                value={customerValue}
                                onChange={(e) => { setCustomerValue(e.target.value); setCustomerError(null); }}
                                disabled={!customerEnabled}
                            />
                            {customerError && (
                                <p className="text-xs text-destructive">{customerError}</p>
                            )}
                        </div>
                    </div>
                )}
                {showTable && (
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="defaultTableEnabled"
                                checked={tableEnabled}
                                onCheckedChange={(checked) => {
                                    setTableEnabled(checked === true);
                                    setTableError(null);
                                }}
                            />
                            <Label htmlFor="defaultTableEnabled" className="cursor-pointer select-none">
                                {t('settings.defaults.tableLabel')}
                            </Label>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Input
                                className={`w-55 ${tableError ? 'border-destructive' : ''}`}
                                placeholder={t('settings.defaults.tablePlaceholder')}
                                value={tableValue}
                                onChange={(e) => { setTableValue(e.target.value); setTableError(null); }}
                                disabled={!tableEnabled}
                            />
                            {tableError && (
                                <p className="text-xs text-destructive">{tableError}</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleSave}>{t('settings.defaults.save')}</Button>
            </CardFooter>
        </Card>
    );
}
