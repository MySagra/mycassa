import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCashRegisters, getUsers } from '@/actions/cashier';
import { toast } from 'sonner';
import { ReprintDialog } from './ReprintDialog';
import { useTranslation } from 'react-i18next';

interface OrderDetailDialogProps {
    order: OrderDetailResponse | null;
    open: boolean;
    loading: boolean;
    onClose: () => void;
    stationsMap?: Record<string, string>;
}

interface CashRegister {
    id: string;
    name: string;
    enabled: boolean;
}

export function OrderDetailDialog({ order, open, loading, onClose, stationsMap }: OrderDetailDialogProps) {
    const [cashRegisterName, setCashRegisterName] = useState<string>('');
    const [operatorName, setOperatorName] = useState<string>('');
    const [reprintOpen, setReprintOpen] = useState(false);
    const { t } = useTranslation();

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

        const fetchOperatorName = async () => {
            if (order?.userId) {
                const result = await getUsers();
                if (result.success) {
                    const user = (result.data as { id: string; username: string }[]).find(u => u.id === order.userId);
                    setOperatorName(user?.username ?? 'N/A');
                } else {
                    setOperatorName('N/A');
                }
            } else {
                setOperatorName('N/A');
            }
        };

        if (order) {
            fetchCashRegisterName();
            fetchOperatorName();
        }
    }, [order]);
    return (
        <>
            <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col select-none">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('orderDetailDialog.title')} {order?.displayCode}
                        </DialogTitle>
                        <DialogDescription>
                            {t('orderDetailDialog.description')}
                        </DialogDescription>
                    </DialogHeader>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">{t('orderDetailDialog.loading')}</div>
                        </div>
                    ) : order ? (
                        <ScrollArea className="overflow-y-auto pr-4">
                            <div className="space-y-4">
                                {/* Order Info */}
                                <div className="grid grid-cols-4 gap-4 p-4 bg-muted dark:bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.customer')}</p>
                                        <h1 className={cn("font-semibold text-sm mb-1 truncate select-none", order.customer.length < 15 ? "text-xl" : "")} title={order.customer}>
                                            {order.customer}
                                        </h1>
                                    </div>
                                    {order.table !== 'NO_TABLE_PRESET' && (
                                        <div className="min-w-0">
                                            <p className="text-sm text-muted-foreground">{t('orderDetailDialog.table')}</p>
                                            <p className="font-medium truncate" title={String(order.table)}>{order.table}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.code')}</p>
                                        <p className="font-mono font-bold text-amber-600">{order.displayCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.ticket')}</p>
                                        <p className="font-mono font-bold text-amber-600">{order.ticketNumber ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.creationDate')}</p>
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
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.confirmationDate')}</p>
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
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.payment')}</p>
                                        <p className="font-mono font-bold text-amber-600">
                                            {order.paymentMethod === 'CARD' ? t('orderDetailDialog.paymentCard') : order.paymentMethod === 'CASH' ? t('orderDetailDialog.paymentCash') : order.paymentMethod || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('orderDetailDialog.status')}</p>
                                        <div className="font-mono font-bold text-amber-600">
                                            {order.status === 'PENDING' ? t('orderDetailDialog.statusPending')
                                                : order.status === 'CONFIRMED' ? t('orderDetailDialog.statusConfirmed')
                                                    : order.status === 'COMPLETED' ? t('orderDetailDialog.statusReady')
                                                        : order.status === 'PICKED_UP' ? t('orderDetailDialog.statusPickedUp')
                                                            : order.status || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold">{t('orderDetailDialog.products')}</h4>
                                    <div className="space-y-3 max-h-[340px] overflow-y-auto ">
                                        {order.categorizedItems.map((catItem, catIndex) => (
                                            <div key={catIndex}>
                                                <h5 className="text-sm font-semibold text-amber-600 mb-2">
                                                    {catItem.category.name}
                                                </h5>
                                                <div className="space-y-2">
                                                    {catItem.items.map((item, itemIndex) => {
                                                        const unitSurcharge = parseFloat(item.unitSurcharge || '0');
                                                        return (
                                                            <div key={itemIndex} className="flex items-start justify-between p-2 bg-muted dark:bg-muted/40 rounded-lg">
                                                                <div className="flex-1">
                                                                    <p className="font-medium">{item.food.name}</p>
                                                                    {item.notes && (
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {t('orderDetailDialog.notes')} {item.notes}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-sm text-muted-foreground mt-1">
                                                                        {t('orderDetailDialog.quantity')} {item.quantity} × {parseFloat(item.unitPrice).toFixed(2)} €
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-semibold">
                                                                        {parseFloat(item.total).toFixed(2)} €
                                                                    </p>
                                                                    {unitSurcharge > 0 && (
                                                                        <p className="text-xs text-amber-600 dark:text-amber-500">
                                                                            (+{unitSurcharge.toFixed(2)} €)
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/20">
                                    <div>
                                        <div className="items-center space-y-0 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold">{t('orderDetailDialog.subtotal')}</div>
                                                <div className="font-bold text-muted-foreground">
                                                    {parseFloat(order.subTotal).toFixed(2)} €
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold">{t('orderDetailDialog.totalSurcharges')}</div>
                                                <div className="font-bold text-amber-600 dark:text-amber-500">
                                                    {parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="font-semibold">{t('orderDetailDialog.discount')}</div>
                                                <div className="font-bold text-green-600 dark:text-green-500">
                                                    {parseFloat(order.discount?.toString() || '0').toFixed(2)} €
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-2xl font-semibold">{t('orderDetailDialog.total')}</div>
                                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                                {parseFloat(order.total).toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Station States */}
                                {order.orderStationStates && order.orderStationStates.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold">{t('dailyOrderCard.stationStates')}</h4>
                                        <div className="space-y-2">
                                            {order.orderStationStates.map((stationState) => {
                                                const statusMap: Record<string, { label: string; className: string }> = {
                                                    PENDING: { label: t('orderStationStatus.pending'), className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
                                                    COMPLETED: { label: t('orderStationStatus.completed'), className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
                                                    CANCELLED: { label: t('orderStationStatus.cancelled'), className: 'bg-red-500/20 text-red-700 dark:text-red-400' },
                                                    PARTIAL: { label: t('orderStationStatus.partial'), className: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' }
                                                };
                                                const statusInfo = statusMap[stationState.status] || { label: stationState.status, className: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' };
                                                const stationName = stationsMap?.[stationState.stationId] || `Station ${stationState.stationId}`;
                                                return (
                                                    <div key={stationState.id} className="flex items-center justify-between p-2 bg-muted dark:bg-muted/40 rounded-lg">
                                                        <span className="text-sm font-medium">{stationName}</span>
                                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusInfo.className}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    ) : null}

                    <DialogFooter>
                        <div className="flex items-center justify-between w-full">
                            <div className='flex flex-col gap-1'>
                                <div className='flex items-center gap-2'>
                                    <div className="text-sm text-muted-foreground">{t('orderDetailDialog.cashRegister')}</div>
                                    <div className="text-sm font-bold text-amber-600">{cashRegisterName}</div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className="text-sm text-muted-foreground">{t('orderDetailDialog.operator')}</div>
                                    <div className="text-sm font-bold text-amber-600">{operatorName}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className='cursor-pointer'
                                    disabled={!order || order.status === 'PENDING'}
                                    onClick={() => setReprintOpen(true)}
                                >
                                    <Printer className="h-4 w-4" />
                                    {t('orderDetailDialog.print')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className='cursor-pointer'
                                    onClick={onClose}
                                >
                                    {t('orderDetailDialog.close')}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reprint Dialog */}
            {order && (
                <ReprintDialog
                    order={order}
                    open={reprintOpen}
                    onClose={() => setReprintOpen(false)}
                />
            )}
        </>
    );
}

