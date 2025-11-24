import { OrderDetailResponse } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';

interface OrderDetailDialogProps {
    order: OrderDetailResponse | null;
    open: boolean;
    loading: boolean;
    onClose: () => void;
}

export function OrderDetailDialog({ order, open, loading, onClose }: OrderDetailDialogProps) {
    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
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
                    <div className="space-y-4">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Cliente</p>
                                <p className="font-medium">{order.customer}</p>
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
                                <p className="text-sm text-muted-foreground">Data</p>
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
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2">
                            <h4 className="font-semibold">Prodotti</h4>
                            <ScrollArea className='overflow-y-auto max-h-[500px]'>
                                <div className="space-y-3">
                                    {order.categorizedItems.map((catItem, catIndex) => (
                                        <div key={catIndex}>
                                            <h5 className="text-sm font-semibold text-amber-600 mb-2">
                                                {catItem.category.name}
                                            </h5>
                                            <div className="space-y-2">
                                                {catItem.items.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="flex items-start justify-between p-2 bg-muted/20 rounded">
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
                            </ScrollArea>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <span className="text-lg font-semibold">Totale</span>
                            <span className="text-2xl font-bold text-amber-600">
                                {parseFloat(order.subTotal).toFixed(2)} €
                            </span>
                        </div>
                    </div>
                ) : null}
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                    >
                        Chiudi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
