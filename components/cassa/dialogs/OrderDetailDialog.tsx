import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCashRegisters } from '@/actions/cassa';
import { toast } from 'sonner';

interface OrderDetailDialogProps {
    order: OrderDetailResponse | null;
    open: boolean;
    loading: boolean;
    onClose: () => void;
}

interface CashRegister {
    id: string;
    name: string;
    enabled: boolean;
}

export function OrderDetailDialog({ order, open, loading, onClose }: OrderDetailDialogProps) {
    const [cashRegisterName, setCashRegisterName] = useState<string>('');

    // Fetch cash register name when order changes
    useEffect(() => {
        const fetchCashRegisterName = async () => {
            if (order?.cashRegisterId) {
                try {
                    const result = await getCashRegisters();
                    if (result.success) {
                        const cashRegisters = result.data as CashRegister[];
                        const cashRegister = cashRegisters.find(cr => cr.id === order.cashRegisterId);
                        if (cashRegister) {
                            setCashRegisterName(cashRegister.name);
                        } else {
                            setCashRegisterName('N/A');
                        }
                    } else {
                        setCashRegisterName('N/A');
                    }
                } catch (error) {
                    console.error('Error fetching cash register:', error);
                    setCashRegisterName('N/A');
                }
            } else {
                setCashRegisterName('N/A');
            }
        };

        if (order) {
            fetchCashRegisterName();
        }
    }, [order]);
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Dettaglio Ordine {order?.displayCode}
                    </DialogTitle>
                    <DialogDescription>
                        Visualizza i dettagli completi dell'ordine
                    </DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Caricamento...</div>
                    </div>
                ) : order ? (
                    <ScrollArea className="overflow-y-auto pr-4">
                        <div className="space-y-4">
                            {/* Order Info */}
                            <div className="grid grid-cols-4 gap-4 p-4 bg-muted dark:bg-muted/40 rounded-lg">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <h1 className={cn("font-semibold text-sm mb-1 truncate select-none", order.customer.length < 15 ? "text-xl" : "")} title={order.customer}>
                                        {order.customer}
                                    </h1>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tavolo</p>
                                    <p className="font-medium">{order.table}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Codice</p>
                                    <p className="font-mono font-bold text-amber-600">{order.displayCode}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Comanda</p>
                                    <p className="font-mono font-bold text-amber-600">{order.ticketNumber ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Data creazione</p>
                                    <p className="text-sm">
                                        {new Date(order.createdAt).toLocaleString('it-IT', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Data conferma</p>
                                    <p className="text-sm">
                                        {order.confirmedAt ? new Date(order.confirmedAt).toLocaleString('it-IT', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Pagamento</p>
                                    <p className="font-mono font-bold text-amber-600">
                                        {order.paymentMethod === 'CARD' ? 'CARTA' : order.paymentMethod === 'CASH' ? 'CONTANTI' : order.paymentMethod || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Stato</p>
                                    <div className="font-mono font-bold text-amber-600">
                                        {order.status === 'PENDING' ? 'IN ATTESA'
                                            : order.status === 'CONFIRMED' ? 'CONFERMATO'
                                                : order.status === 'COMPLETED' ? 'PRONTO'
                                                    : order.status === 'PICKED_UP' ? 'RITIRATO'
                                                        : order.status || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-2">
                                <h4 className="font-semibold">Prodotti</h4>
                                <div className="space-y-3 max-h-[340px] overflow-y-auto ">
                                    {order.categorizedItems.map((catItem, catIndex) => (
                                        <div key={catIndex}>
                                            <h5 className="text-sm font-semibold text-amber-600 mb-2">
                                                {catItem.category.name}
                                            </h5>
                                            <div className="space-y-2">
                                                {catItem.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="flex items-start justify-between p-2 bg-muted dark:bg-muted/40 rounded-lg">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.food.name}</p>
                                                            {item.notes && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Note: {item.notes}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                Quantità: {item.quantity} × {parseFloat(item.food.price).toFixed(2)} €
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">
                                                                {(item.quantity * parseFloat(item.food.price)).toFixed(2)} €
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <div>
                                    <div className="items-center space-y-0 text-xs">
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">Subtotale:</div>
                                            <div className="font-bold text-muted-foreground">
                                                {parseFloat(order.subTotal).toFixed(2)} €
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">Sovrapprezzi:</div>
                                            <div className="font-bold text-amber-600 dark:text-amber-500">
                                                {parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="font-semibold">Sconto:</div>
                                            <div className="font-bold text-green-600 dark:text-green-500">
                                                {parseFloat(order.discount?.toString() || '0').toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-2xl font-semibold">Totale:</div>
                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                            {parseFloat(order.total).toFixed(2)} €
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                ) : null}


                <DialogFooter>
                    <div className="flex items-center justify-between w-full">
                        <div className='flex items-center gap-2'>
                            <div className="text-sm text-muted-foreground">Cassa:</div>
                            <div className="text-sm font-bold text-amber-600">{cashRegisterName}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => toast.error('Funzionalità di stampa non ancora implementata')}
                            >
                                <Printer className="h-4 w-4" />
                                Stampa
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onClose}
                            >
                                Chiudi
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
