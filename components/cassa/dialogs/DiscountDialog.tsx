import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { discountAmountSchema } from '@/lib/cassa/validations';
import { useTranslation } from 'react-i18next';

interface DiscountDialogProps {
    open: boolean;
    currentDiscount: number;
    orderTotal?: number;
    onClose: () => void;
    onApply: (amount: number) => void;
    onRemove: () => void;
}

export function DiscountDialog({ open, currentDiscount, orderTotal, onClose, onApply, onRemove }: DiscountDialogProps) {
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [validationError, setValidationError] = useState<string | undefined>();
    const { t } = useTranslation();

    useEffect(() => {
        if (open) {
            setDiscountAmount('');
            setValidationError(undefined);
        }
    }, [open]);

    const handleApply = () => {
        if (!discountAmount.trim()) {
            onApply(0);
            onClose();
            return;
        }

        const result = discountAmountSchema.safeParse(discountAmount);

        if (!result.success) {
            setValidationError(result.error.issues[0].message);
            toast.error(result.error.issues[0].message);
            return;
        }

        setValidationError(undefined);

        let finalAmount = result.data;
        if (orderTotal !== undefined && finalAmount > orderTotal) {
            finalAmount = orderTotal;
            toast.warning(t('discountDialog.discountCapped', { amount: finalAmount.toFixed(2) }));
        }

        onApply(finalAmount);
        onClose();
        toast.success(t('discountDialog.toastApplied', { amount: finalAmount.toFixed(2) }));
    };

    const handleRemove = () => {
        onRemove();
        setDiscountAmount('');
        onClose();
        toast.success(t('discountDialog.toastRemoved'));
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('discountDialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('discountDialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="discountAmount">{t('discountDialog.discountLabel')}</Label>
                        <div className="relative">
                            <Input
                                autoComplete='off'
                                id="discountAmount"
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={discountAmount}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    // Allow only numbers, dot, and comma
                                    if (value === '' || /^[0-9.,]*$/.test(value)) {
                                        // Check if it matches the pattern for valid amount
                                        if (value === '' || /^[0-9]{0,4}([.,][0-9]{0,2})?$/.test(value)) {
                                            setDiscountAmount(value);
                                            setValidationError(undefined);
                                        }
                                    }
                                }}
                                className={`text-right pr-8 ${validationError ? 'border-red-500' : ''}`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                €
                            </span>
                        </div>
                        {validationError && (
                            <p className="text-xs text-red-500 mt-1">{validationError}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {t('discountDialog.maxDiscount')}
                        </p>
                    </div>

                    {currentDiscount > 0 && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground mb-1">{t('discountDialog.currentDiscount')}</p>
                            <p className="text-lg font-semibold text-amber-600">{currentDiscount.toFixed(2)} €</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="destructive"
                        className='cursor-pointer'
                        onClick={handleRemove}
                    >
                        {t('discountDialog.removeDiscount')}
                    </Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
                        onClick={handleApply}
                    >
                        {t('discountDialog.apply')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
