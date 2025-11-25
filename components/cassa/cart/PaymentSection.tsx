import { PaymentMethod } from '@/lib/api-types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { CreditCard, Banknote } from 'lucide-react';

interface PaymentSectionProps {
    total: number;
    surcharges: number;
    discount: number;
    paymentMethod: PaymentMethod;
    paidAmount: string;
    change: number;
    validationErrors: { paidAmount?: string };
    onUpdatePaymentMethod: (method: PaymentMethod) => void;
    onUpdatePaidAmount: (value: string) => void;
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
    onUpdatePaidAmount
}: PaymentSectionProps) {
    return (
        <div className="space-y-4 p-4">
            {/* Total */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold select-none">TOTALE:</span>
                    <span className="text-2xl font-bold text-amber-500 select-none">
                        {total.toFixed(2)} €
                    </span>
                </div>
                {surcharges > 0 && (
                    <div className="flex items-center justify-between text-sm text-amber-600 dark:text-amber-500">
                        <span>Sovrapprezzi totali:</span>
                        <span className="font-semibold">
                            +{surcharges.toFixed(2)} €
                        </span>
                    </div>
                )}
                {discount > 0 && (
                    <div className="flex items-center justify-between text-sm text-green-600 dark:text-green-500">
                        <span>Sconto applicato:</span>
                        <span className="font-semibold">
                            -{discount.toFixed(2)} €
                        </span>
                    </div>
                )}
            </div>

            {/* Payment Method */}
            <div>
                <Label>Metodo Pagamento *</Label>
                <ButtonGroup className="mt-2 w-full">
                    <Button
                        variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                        className="flex-1 select-none"
                        onClick={() => onUpdatePaymentMethod('CASH')}
                    >
                        <Banknote className="mr-2 h-4 w-4" />
                        Contanti
                    </Button>
                    <Button
                        variant={paymentMethod === 'CARD' ? 'default' : 'outline'}
                        className="flex-1 select-none"
                        onClick={() => onUpdatePaymentMethod('CARD')}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Carta
                    </Button>
                </ButtonGroup>
            </div>

            {/* Cash Payment Details */}
            {paymentMethod === 'CASH' && (
                <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                    <div className="grid grid-cols-2 gap-4 item">
                        <div>
                            <Label htmlFor="paidAmount" className='text-base'>Pagato dal cliente</Label>
                            <div className="relative mt-3">
                                <Input
                                    id="paidAmount"
                                    type="text"
                                    placeholder="0.00"
                                    value={paidAmount}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow only numbers, dot, and comma
                                        if (value === '' || /^[0-9.,]*$/.test(value)) {
                                            // Check if it matches the pattern for valid amount
                                            if (value === '' || /^[0-9]{0,4}([.,][0-9]{0,2})?$/.test(value)) {
                                                onUpdatePaidAmount(value);
                                            }
                                        }
                                    }}
                                    className={`text-right pr-8 ${validationErrors.paidAmount ? 'border-red-500' : ''}`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    €
                                </span>
                            </div>
                            {validationErrors.paidAmount && (
                                <p className="text-xs text-red-500 mt-1">{validationErrors.paidAmount}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                            <span className="text-base font-medium select-none">Resto</span>
                            <div className='w-full h-full flex place-content-end items-center select-none'>
                                <span className={`text-2xl font-bold ${change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {change.toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
