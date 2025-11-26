import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCashRegisters } from '@/actions/cassa';
import { toast } from 'sonner';

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

    // Fetch cash registers when dialog opens
    useEffect(() => {
        if (open) {
            const fetchCashRegisters = async () => {
                try {
                    const data: CashRegister[] = await getCashRegisters();
                    setCashRegisters(data.filter(cr => cr.enabled));
                } catch (error: any) {
                    console.error('Error fetching cash registers:', error);
                    toast.error(error.message || 'Errore nel caricamento delle casse');
                } finally {
                    setLoading(false);
                }
            };

            fetchCashRegisters();
        }
    }, [open]);

    const handleSave = () => {
        if (!selectedCashRegister) {
            toast.error('Seleziona una cassa');
            return;
        }

        const cashRegister = cashRegisters.find(cr => cr.id === selectedCashRegister);
        if (cashRegister) {
            localStorage.setItem('selectedCashRegister', selectedCashRegister);
            onCashRegisterSelected(selectedCashRegister, cashRegister.name);
            toast.success('Cassa configurata con successo');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configurazione Mancante</DialogTitle>
                    <DialogDescription>
                        Per utilizzare MyCassa devi prima configurare la cassa.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cash-register">Seleziona cassa</Label>
                        <Select
                            value={selectedCashRegister}
                            onValueChange={setSelectedCashRegister}
                            disabled={loading}
                        >
                            <SelectTrigger id="cash-register">
                                <SelectValue placeholder={loading ? "Caricamento..." : "Seleziona una cassa"} />
                            </SelectTrigger>
                            <SelectContent>
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
                    <Button onClick={handleSave} disabled={!selectedCashRegister || loading}>
                        Salva configurazione
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}