import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCashRegisters } from '@/actions/cashier';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();

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
    }, []);

    const handleCashRegisterChange = (value: string) => {
        setSelectedCashRegister(value);
        localStorage.setItem('selectedCashRegister', value);
        toast.success(t('settings.printers.toastSaved'));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 select-none">
                    <Printer className="h-5 w-5 text-amber-600" />
                    <CardTitle>{t('settings.printers.title')}</CardTitle>
                </div>
                <CardDescription className='select-none'>
                    {t('settings.printers.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5 select-none">
                        <Label className="mb-2">{t('settings.printers.selectRegister')}</Label>
                        <Select value={selectedCashRegister} onValueChange={handleCashRegisterChange} disabled={loading}>
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder={loading ? t('settings.printers.loading') : t('settings.printers.selectRegisterPlaceholder')} />
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
