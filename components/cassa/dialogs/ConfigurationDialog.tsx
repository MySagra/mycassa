import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCashRegisters } from '@/actions/cashier';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

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
    // Registers that exist but are disabled: only admins and maintainers get them from the API
    const [hasDisabled, setHasDisabled] = useState(false);
    // The list was fetched successfully, so an empty one really means no register
    const [loaded, setLoaded] = useState(false);
    const [selectedCashRegister, setSelectedCashRegister] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();
    const { user } = useAuth();
    const role = (typeof user?.role === 'string' ? user.role : (user?.role as { name?: string } | undefined)?.name ?? '').toUpperCase();

    // Bumped by Riprova to fetch the list again
    const [reloadKey, setReloadKey] = useState(0);
    // The fetch in progress was asked for by Riprova
    const retryingRef = useRef(false);

    // Fetch cash registers when dialog opens
    useEffect(() => {
        if (open) {
            const fetchCashRegisters = async () => {
                try {
                    const result = await getCashRegisters();
                    if (result.success) {
                        const all = result.data as CashRegister[];
                        const enabled = all.filter(cr => cr.enabled);
                        setCashRegisters(enabled);
                        setHasDisabled(all.some(cr => !cr.enabled));
                        setLoaded(true);
                        // Riprova found nothing new: say so, or the click looks ignored
                        if (retryingRef.current && enabled.length === 0) {
                            toast.warning(t('configDialog.noRegisterFound'));
                        }
                    } else {
                        toast.error(result.error || t('configDialog.errorLoading'));
                    }
                } catch (error: any) {
                    console.error('Error fetching cash registers:', error);
                    toast.error(error.message || t('configDialog.errorLoading'));
                } finally {
                    retryingRef.current = false;
                    setLoading(false);
                }
            };

            fetchCashRegisters();
        }
    }, [open, reloadKey]);

    const handleRetry = () => {
        retryingRef.current = true;
        setLoading(true);
        setReloadKey(key => key + 1);
    };

    // What to do when no register can be picked: in MySagra only admins create
    // registers, maintainers can only enable them, operators can do neither
    const noRegisterMessage = role === 'ADMIN'
        ? t('configDialog.noRegisterAdmin')
        : role === 'MAINTAINER' && hasDisabled
            ? t('configDialog.noRegisterEnable')
            : t('configDialog.noRegisterAskAdmin');
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
                {!loaded && loading ? (
                    // Until the first answer it is not known which content applies: on a slow
                    // connection the selection would show first and then turn into the alert
                    <>
                        <DialogHeader>
                            <DialogTitle className="sr-only">{t('configDialog.title')}</DialogTitle>
                            <DialogDescription className="sr-only">{t('configDialog.searchingRegisters')}</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                            <Spinner className="size-6" />
                            <p className="text-sm select-none">{t('configDialog.searchingRegisters')}</p>
                        </div>
                    </>
                ) : loaded && cashRegisters.length === 0 ? (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                </div>
                                <DialogTitle>{t('configDialog.noRegisterTitle')}</DialogTitle>
                            </div>
                            <DialogDescription className="pt-2">
                                {noRegisterMessage}
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter>
                            <Button className='cursor-pointer' onClick={handleRetry} disabled={loading}>
                                {loading ? t('configDialog.loading') : t('configDialog.retry')}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}