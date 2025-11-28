import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCashRegisters } from '@/actions/cassa';

interface CashRegister {
    id: string;
    name: string;
    enabled: boolean;
    defaultPrinterId: string;
}

export function PrintersSettingsCard() {
    const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Load selected cash register from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('selectedCashRegister');
        if (saved) {
            setSelectedCashRegister(saved);
        }
    }, []);

    // Fetch cash registers on mount
    useEffect(() => {
        const fetchCashRegisters = async () => {
            try {
                const result = await getCashRegisters();
                if (result.success) {
                    setCashRegisters((result.data as CashRegister[]).filter(cr => cr.enabled));
                } else {
                    toast.error(result.error || 'Errore nel caricamento delle casse');
                }
            } catch (error: any) {
                console.error('Error fetching cash registers:', error);
                toast.error(error.message || 'Errore nel caricamento delle casse');
            } finally {
                setLoading(false);
            }
        };

        fetchCashRegisters();
    }, []);

    const handleCashRegisterChange = (value: string) => {
        setSelectedCashRegister(value);
        localStorage.setItem('selectedCashRegister', value);
        toast.success('Cassa selezionata salvata');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 select-none">
                    <Printer className="h-5 w-5 text-amber-600" />
                    <CardTitle>Stampanti</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    Configura le impostazioni delle stampanti connesse all'applicazione
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="mb-2">Seleziona cassa</Label>
                        <Select value={selectedCashRegister} onValueChange={handleCashRegisterChange} disabled={loading}>
                            <SelectTrigger className="w-[220px]">
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
            </CardContent>
        </Card>
    );
}
