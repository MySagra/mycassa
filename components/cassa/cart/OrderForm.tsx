"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserX } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface OrderFormProps {
    displayCode: string;
    customer: string;
    table: string;
    enableTableInput: boolean;
    requireCustomer: boolean;
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
    enableTableInput,
    requireCustomer,
    tableInputDisabled,
    validationErrors,
    onUpdateDisplayCode,
    onUpdateCustomer,
    onUpdateTable,
    onLoadOrder,
    loadingOrder
}: OrderFormProps) {
    const { t } = useTranslation();
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
            <div className={`grid ${enableTableInput && !tableInputDisabled ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                    <Label htmlFor="customer" className='mb-2'>{t('orderForm.customer')}{requireCustomer && !customerHasDefault ? ' *' : ''}</Label>
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

                {enableTableInput && !tableInputDisabled && (
                    <div>
                        <Label htmlFor="table" className='mb-2'>{t('orderForm.table')}{!tableHasDefault ? ' *' : ''}</Label>
                        <Input
                            autoComplete='off'
                            id="table"
                            placeholder={t('orderForm.tablePlaceholder')}
                            value={table}
                            onChange={(e) => onUpdateTable(e.target.value)}
                            className={validationErrors.table ? 'border-red-500' : ''}
                        />
                        {validationErrors.table && (
                            <p className="text-xs text-red-500 mt-1">{validationErrors.table}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}