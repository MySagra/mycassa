"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { getOrderFieldsConfig } from '@/lib/cassa/order-fields';

interface OrderFormProps {
    displayCode: string;
    customer: string;
    table: string;
    tableInputDisabled?: boolean;
    validationErrors: { customer?: string; table?: string };
    onUpdateDisplayCode: (value: string) => void;
    onUpdateCustomer: (value: string) => void;
    onUpdateTable: (value: string) => void;
    onLoadOrder: () => void;
    loadingOrder: boolean;
}

export function OrderForm({
    displayCode,
    customer,
    table,
    tableInputDisabled,
    validationErrors,
    onUpdateDisplayCode,
    onUpdateCustomer,
    onUpdateTable,
    onLoadOrder,
    loadingOrder
}: OrderFormProps) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const fields = getOrderFieldsConfig(settings);
    const showCustomer = fields.customer !== 'HIDDEN';
    const showTable = fields.table !== 'HIDDEN' && !tableInputDisabled;
    const tablePlaceholder = fields.tableNumberOnly
        ? t('orderForm.tablePlaceholderNumber')
        : fields.tableTextOnly
            ? t('orderForm.tablePlaceholderText')
            : t('orderForm.tablePlaceholder');
    const [customerHasDefault, setCustomerHasDefault] = useState(false);
    const [tableHasDefault, setTableHasDefault] = useState(false);

    useEffect(() => {
        const sync = () => {
            setCustomerHasDefault(localStorage.getItem('defaultCustomerEnabled') === 'true');
            setTableHasDefault(localStorage.getItem('defaultTableEnabled') === 'true');
        };
        sync();
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, []);

    return (
        <div className="space-y-2 p-4">
            {/* Load Order */}
            <div>
                <Label htmlFor="displayCode" className='mb-2'>{t('orderForm.loadOrder')}</Label>
                <div className="mt-1 flex gap-2">
                    <div className="flex flex-1">
                        <Input
                            autoComplete='off'
                            id="displayCode"
                            placeholder={t('orderForm.orderCodePlaceholder')}
                            value={displayCode}
                            onChange={(e) => onUpdateDisplayCode(e.target.value.toUpperCase())}
                            maxLength={4}
                            enterKeyHint="enter"
                            className="rounded-r-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onLoadOrder();
                                }
                            }}
                        />
                        <Button
                            onClick={onLoadOrder}
                            className="cursor-pointer rounded-l-none border-l-0"
                            disabled={loadingOrder}
                        >
                            {loadingOrder ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer shrink-0"
                                onClick={() => {
                                    onUpdateCustomer('NO_CUSTOMER');
                                    onUpdateTable('NO_TABLE');
                                }}
                            >
                                <UserX className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('orderForm.noCustomer')}</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Customer and Table */}
            {(showCustomer || showTable) && (
            <div className={`grid ${showCustomer && showTable ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {showCustomer && (
                <div>
                    <Label htmlFor="customer" className='mb-2'>{t('orderForm.customer')}{fields.customer === 'REQUIRED' && !customerHasDefault ? ' *' : ''}</Label>
                    <Input
                        autoComplete='off'
                        id="customer"
                        placeholder={t('orderForm.customerPlaceholder')}
                        value={customer}
                        onChange={(e) => onUpdateCustomer(e.target.value)}
                        className={validationErrors.customer ? 'border-red-500' : ''}
                    />
                    {validationErrors.customer && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.customer}</p>
                    )}
                </div>
                )}

                {showTable && (
                    <div>
                        <Label htmlFor="table" className='mb-2'>
                            {t('orderForm.table')}{fields.table === 'REQUIRED' && !tableHasDefault ? ' *' : ''}
                            {fields.maxTables !== null && !fields.tableTextOnly && (
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    {t('orderForm.tableMax', { max: fields.maxTables })}
                                </span>
                            )}
                        </Label>
                        <Input
                            autoComplete='off'
                            id="table"
                            placeholder={tablePlaceholder}
                            value={table}
                            inputMode={fields.tableNumberOnly ? 'numeric' : 'text'}
                            onChange={(e) => onUpdateTable(
                                fields.tableNumberOnly ? e.target.value.replace(/\D/g, '') : e.target.value
                            )}
                            className={validationErrors.table ? 'border-red-500' : ''}
                        />
                        {validationErrors.table && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors.table}</p>
                        )}
                    </div>
                )}
            </div>
            )}
        </div>
    );
}