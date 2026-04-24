'use client';

import { useState, useEffect } from 'react';
import { OrderDetailResponse } from '@/lib/api-types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { FileText, Printer } from 'lucide-react';
import { getCashRegisters, getUsers } from '@/actions/cashier';
import { ReprintDialog } from '@/components/cassa/dialogs/ReprintDialog';
import { useTranslation } from 'react-i18next';

interface MobileOrderDetailDrawerProps {
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

export function MobileOrderDetailDrawer({ order, open, loading, onClose }: MobileOrderDetailDrawerProps) {
    const [cashRegisterName, setCashRegisterName] = useState<string>('');
    const [operatorName, setOperatorName] = useState<string>('');
    const [reprintOpen, setReprintOpen] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (!order) return;
        const fetchCashRegisterName = async () => {
            if (order.cashRegisterId) {
                try {
                    const result = await getCashRegisters();
                    if (result.success) {
                        const cashRegisters = result.data as CashRegister[];
                        const cr = cashRegisters.find((c) => c.id === order.cashRegisterId);
                        setCashRegisterName(cr?.name ?? 'N/A');
                    } else {
                        setCashRegisterName('N/A');
                    }
                } catch {
                    setCashRegisterName('N/A');
                }
            } else {
                setCashRegisterName('N/A');
            }
        };
        const fetchOperatorName = async () => {
            if (order.userId) {
                const result = await getUsers();
                if (result.success) {
                    const user = (result.data as { id: string; username: string }[]).find((u) => u.id === order.userId);
                    setOperatorName(user?.username ?? 'N/A');
                } else {
                    setOperatorName('N/A');
                }
            } else {
                setOperatorName('N/A');
            }
        };
        fetchCashRegisterName();
        fetchOperatorName();
    }, [order]);

    return (
        <>
            <Drawer open={open} onOpenChange={(isOpen) => { if (!isOpen) { (document.activeElement as HTMLElement)?.blur(); onClose(); } }}>
                <DrawerContent className="flex flex-col" style={{ maxHeight: '92dvh' }}>
                    <DrawerHeader className="pb-2">
                        <DrawerTitle className="flex items-center justify-center gap-2">
                            <FileText className="h-5 w-5" />
                            {t('orderDetailDialog.title')} {order?.displayCode}
                        </DrawerTitle>
                        <DrawerDescription className="text-center">{t('orderDetailDialog.description')}</DrawerDescription>
                    </DrawerHeader>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-muted-foreground">{t('orderDetailDialog.loading')}</p>
                        </div>
                    ) : order ? (
                        <div className="flex-1 min-h-0 overflow-y-auto px-4">
                            <div className="space-y-4 pb-4">
                                {/* Info grid */}
                                <div className="grid grid-cols-2 gap-3 p-3 bg-muted dark:bg-muted/40 rounded-lg">
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.customer')}</p>
                                        <p className="font-semibold text-sm truncate">{order.customer}</p>
                                    </div>
                                    {order.table !== 'NO_TABLE_PRESET' && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">{t('orderDetailDialog.table')}</p>
                                            <p className="font-medium text-sm truncate">{order.table}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.code')}</p>
                                        <p className="font-mono font-bold text-amber-600">{order.displayCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.ticket')}</p>
                                        <p className="font-mono font-bold text-amber-600">{order.ticketNumber ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.payment')}</p>
                                        <p className="font-mono font-bold text-amber-600 text-sm">
                                            {order.paymentMethod === 'CARD'
                                                ? t('orderDetailDialog.paymentCard')
                                                : order.paymentMethod === 'CASH'
                                                    ? t('orderDetailDialog.paymentCash')
                                                    : order.paymentMethod || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.status')}</p>
                                        <p className="font-mono font-bold text-amber-600 text-sm">
                                            {order.status === 'PENDING' ? t('orderDetailDialog.statusPending')
                                                : order.status === 'CONFIRMED' ? t('orderDetailDialog.statusConfirmed')
                                                    : order.status === 'COMPLETED' ? t('orderDetailDialog.statusReady')
                                                        : order.status === 'PICKED_UP' ? t('orderDetailDialog.statusPickedUp')
                                                            : order.status || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.creationDate')}</p>
                                        <p className="text-xs">
                                            {new Date(order.createdAt).toLocaleString('it-IT', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.cashRegister')}</p>
                                        <p className="text-sm font-bold text-amber-600">{cashRegisterName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.operator')}</p>
                                        <p className="text-sm font-bold text-amber-600">{operatorName}</p>
                                    </div>
                                </div>

                                {/* Items by category */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">{t('orderDetailDialog.products')}</h4>
                                    <div className="space-y-3">
                                        {order.categorizedItems.map((catItem, catIndex) => (
                                            <div key={catIndex}>
                                                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                                                    {catItem.category.name}
                                                </p>
                                                <div className="border rounded-lg divide-y">
                                                    {catItem.items.map((item, itemIndex) => {
                                                        const unitSurcharge = parseFloat(item.unitSurcharge || '0');
                                                        return (
                                                            <div key={itemIndex} className="flex items-start justify-between px-3 py-2 gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{item.food.name}</p>
                                                                    {item.notes && (
                                                                        <p className="text-xs text-muted-foreground">{t('orderDetailDialog.notes')} {item.notes}</p>
                                                                    )}
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.quantity} × {parseFloat(item.unitPrice).toFixed(2)} €
                                                                    </p>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-sm font-bold">{parseFloat(item.total).toFixed(2)} €</p>
                                                                    {unitSurcharge > 0 && (
                                                                        <p className="text-xs text-amber-600">(+{unitSurcharge.toFixed(2)} €)</p>
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

                                {/* Totals */}
                                <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/20 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold">{t('orderDetailDialog.subtotal')}</span>
                                        <span className="text-muted-foreground font-bold">{parseFloat(order.subTotal).toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold">{t('orderDetailDialog.totalSurcharges')}</span>
                                        <span className="text-amber-600 font-bold">{parseFloat(order.surcharge?.toString() || '0').toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="font-semibold">{t('orderDetailDialog.discount')}</span>
                                        <span className="text-green-600 font-bold">{parseFloat(order.discount?.toString() || '0').toFixed(2)} €</span>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t">
                                        <span className="text-lg font-semibold">{t('orderDetailDialog.total')}</span>
                                        <span className="text-lg font-bold text-amber-600">{parseFloat(order.total).toFixed(2)} €</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex gap-3 p-4 border-t shrink-0">
                        <Button
                            variant="outline"
                            className="flex-1 h-11 cursor-pointer"
                            disabled={!order || order.status === 'PENDING'}
                            onClick={() => setReprintOpen(true)}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            {t('orderDetailDialog.print')}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-11 cursor-pointer"
                            onClick={onClose}
                        >
                            {t('orderDetailDialog.close')}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

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
