import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { discountAmountSchema } from '@/lib/cassa/validations';

interface DiscountDialogProps {
    open: boolean;
    currentDiscount: number;
    onClose: () => void;
    onApply: (amount: number) => void;
    onRemove: () => void;
}

export function DiscountDialog({ open, currentDiscount, onClose, onApply, onRemove }: DiscountDialogProps) {
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [validationError, setValidationError] = useState<string | undefined>();

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
        onApply(result.data);
        onClose();
        toast.success(`Sconto di ${result.data.toFixed(2)} € applicato`);
    };

    const handleRemove = () => {
        onRemove();
        setDiscountAmount('');
        onClose();
        toast.success('Sconto rimosso');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Applica Sconto</DialogTitle>
                    <DialogDescription>
                        Inserisci l'importo dello sconto da applicare al totale dell'ordine
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="discountAmount">Sconto (€)</Label>
                        <div className="relative">
                            <Input
                                autoComplete='off'
                                id="discountAmount"
                                type="text"
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
                            Sconto massimo: 9999.99 €
                        </p>
                    </div>

                    {currentDiscount > 0 && (
                        <div className="rounded-lg border bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground mb-1">Sconto attualmente applicato:</p>
                            <p className="text-lg font-semibold text-amber-600">{currentDiscount.toFixed(2)} €</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        className='cursor-pointer'
                        onClick={() => {
                            onClose();
                            setDiscountAmount('');
                            setValidationError(undefined);
                        }}
                    >
                        Annulla
                    </Button>
                    <Button
                        variant="destructive"
                        className='cursor-pointer'
                        onClick={handleRemove}
                    >
                        Rimuovi Sconto
                    </Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
                        onClick={handleApply}
                    >
                        Applica
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
