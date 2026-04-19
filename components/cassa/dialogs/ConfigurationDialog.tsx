import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCashRegisters } from '@/actions/cashier';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CashRegister {
    id: string;
    name: string;
    enabled: boolean;
    defaultPrinterId: string;
}

interface ConfigurationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCashRegisterSelected: (cashRegisterId: string, cashRegisterName: string) => void;
}

export function ConfigurationDialog({ open, onOpenChange, onCashRegisterSelected }: ConfigurationDialogProps) {
    const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    // Fetch cash registers when dialog opens
    useEffect(() => {
        if (open) {
            const fetchCashRegisters = async () => {
                try {
                    const result = await getCashRegisters();
                    if (result.success) {
                        setCashRegisters((result.data as CashRegister[]).filter(cr => cr.enabled));
                    } else {
                        toast.error(result.error || t('configDialog.errorLoading'));
                    }
                } catch (error: any) {
                    console.error('Error fetching cash registers:', error);
                    toast.error(error.message || t('configDialog.errorLoading'));
                } finally {
                    setLoading(false);
                }
            };

            fetchCashRegisters();
        }
    }, [open]);
    const handleSave = () => {
        if (!selectedCashRegister) {
            toast.error(t('configDialog.selectRegisterToast'));
            return;
        }

        const cashRegister = cashRegisters.find(cr => cr.id === selectedCashRegister);
        if (cashRegister) {
            localStorage.setItem('selectedCashRegister', selectedCashRegister);
            onCashRegisterSelected(selectedCashRegister, cashRegister.name);
            toast.success(t('configDialog.configuredToast'));
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('configDialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('configDialog.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cash-register">{t('configDialog.selectRegisterLabel')}</Label>
                        <Select
                            value={selectedCashRegister}
                            onValueChange={setSelectedCashRegister}
                            disabled={loading}
                        >
                            <SelectTrigger id="cash-register">
                                <SelectValue placeholder={loading ? t('configDialog.loading') : t('configDialog.selectRegisterPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent >
                                <SelectGroup>
                                    {cashRegisters.map((cr) => (
                                        <SelectItem key={cr.id} value={cr.id}>
                                            {cr.name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button className='cursor-pointer' onClick={handleSave} disabled={!selectedCashRegister || loading}>
                        {t('configDialog.saveConfig')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}