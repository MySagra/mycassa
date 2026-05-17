import { PaymentMethod } from '@/lib/api-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { CreditCard, Banknote, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentSectionProps {
    total: number;
    surcharges: number;
    discount: number;
    paymentMethod: PaymentMethod | null;
    paidAmount: string;
    change: number;
    validationErrors: { paidAmount?: string };
    onUpdatePaymentMethod: (method: PaymentMethod | null) => void;
    onUpdatePaidAmount: (value: string) => void;
    onOpenCalculator?: () => void;
    previousTotal?: number | null;
    previousTotalProgress?: number;
}

export function PaymentSection({
    total,
    surcharges,
    discount,
    paymentMethod,
    paidAmount,
    change,
    validationErrors,
    onUpdatePaymentMethod,
    onUpdatePaidAmount,
    onOpenCalculator,
    previousTotal,
    previousTotalProgress = 100,
}: PaymentSectionProps) {
    const displayTotal = previousTotal ?? total ?? 0;
    const displayChange = (parseFloat(paidAmount.replace(',', '.')) || 0) - (displayTotal || 0);
    const { t } = useTranslation();

    return (
        <div className="space-y-2 p-4 pt-1.5">
            {/* Total */}
            <div className="text-xs mb-0.5">
                {total - surcharges + discount !== total && (
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>{t('payment.subtotal')}:</span>
                        <span className="font-semibold">
                            {(total - surcharges + discount).toFixed(2)} €
                        </span>
                    </div>
                )}
                {surcharges > 0 && (
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-500">
                        <span>{t('payment.surcharges')}:</span>
                        <span className="font-semibold">
                            +{surcharges.toFixed(2)} €
                        </span>
                    </div>
                )}
                {discount > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-500">
                        <span>{t('payment.discount')}:</span>
                        <span className="font-semibold">
                            -{discount.toFixed(2)} €
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold select-none">
                    {previousTotal !== null ? t('payment.lastOrderTotal') : t('payment.total')}:
                </span>
                <span className="text-2xl font-bold text-amber-500 select-none">
                    {displayTotal.toFixed(2)} €
                </span>
            </div>

            {/* Cash Payment Details — hidden on mobile when calculator replaces it */}
            {paymentMethod === 'CASH' && !onOpenCalculator && (
                <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-4 item">
                        <div>
                            <Label htmlFor="paidAmount" className='text-base'>{t('payment.paidByCustomer')}</Label>
                            <div className="relative mt-3">
                                <Input
                                    autoComplete='off'
                                    id="paidAmount"
                                    type="text"
                                    placeholder="0.00"
                                    value={paidAmount}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^[0-9.,]*$/.test(value)) {
                                            if (value === '' || /^[0-9]{0,4}([.,][0-9]{0,2})?$/.test(value)) {
                                                onUpdatePaidAmount(value);
                                            }
                                        }
                                    }}
                                    className={`text-right pr-8 ${validationErrors.paidAmount ? 'border-red-500' : ''}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground select-none">
                                    €
                                </span>
                            </div>
                            {validationErrors.paidAmount && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.paidAmount}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            <span className="text-base font-medium select-none">{t('payment.change')}</span>
                            <div className='w-full h-full flex place-content-end items-center select-none'>
                                <span className={`text-2xl font-bold ${displayChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {displayChange.toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        {/* Payment Method */}
            <div>
                <Label>{t('payment.paymentMethod')} *</Label>
                <div className="mt-2 flex gap-2">
                    {onOpenCalculator && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0 cursor-pointer"
                            onClick={onOpenCalculator}
                            aria-label="Calcolatore resto"
                        >
                            <Calculator className="h-4 w-4" />
                        </Button>
                    )}
                    <ButtonGroup className="flex-1">
                        <Button
                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                            className="flex-1 select-none cursor-pointer"
                            onClick={() => onUpdatePaymentMethod('CASH')}
                        >
                            <Banknote className="mr-2 h-4 w-4" />
                            {t('payment.cash')}
                        </Button>
                        <Button
                            variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                            className="flex-1 select-none cursor-pointer"
                            onClick={() => onUpdatePaymentMethod('CARD')}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            {t('payment.card')}
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

        </div >
    );
}
