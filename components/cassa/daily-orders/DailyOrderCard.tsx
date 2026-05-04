import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, ShoppingCart, X } from 'lucide-react';
import { DailyOrder } from '@/lib/cassa/types';
import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DailyOrderCardProps {
    order: DailyOrder;
    onViewDetail: () => void;
    onLoadToCart: () => void;
    onCancelOrder: () => void;
    searchQuery: string;
}

export function DailyOrderCard({ order, onViewDetail, onLoadToCart, onCancelOrder, searchQuery }: DailyOrderCardProps) {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const statusMap: Record<string, { label: string; className: string }> = {
        PENDING: { label: t('dailyOrderCard.statusPending'), className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
        CONFIRMED: { label: t('dailyOrderCard.statusConfirmed'), className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
        COMPLETED: { label: t('dailyOrderCard.statusCompleted'), className: 'bg-pink-500/20 text-pink-700 dark:text-pink-400' },
        PICKED_UP: { label: t('dailyOrderCard.statusPickedUp'), className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
        CANCELLED: { label: t('dailyOrderCard.statusCancelled'), className: 'bg-red-500/20 text-red-700 dark:text-red-400' }
    };

    const getStatusBadge = (status: string) => {
        const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' };

        return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                {statusInfo.label}
            </span>
        );
    };

    useEffect(() => {
        if (cardRef.current) {
            cardRef.current.classList.add('ring-2', 'ring-amber-500');

            const timer = setTimeout(() => {
                if (cardRef.current) {
                    cardRef.current.classList.remove('ring-2', 'ring-amber-500');
                }
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, []);

    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<span class="bg-amber-500 rounded px-0.5 ">$1</span>');
    };

    const isPending = order.status === 'PENDING';
    const isConfirmed = order.status === 'CONFIRMED';

    return (
        <>
            <Card ref={cardRef} className="border hover:border-amber-500 transition-all duration-300">
                <CardContent className="space-y-3">
                    <div className="flex items-start justify-between select-none min-w-0">
                        <div className="space-y-1 min-w-0 flex-1 mr-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className="font-mono font-bold text-lg text-amber-600 shrink-0"
                                    dangerouslySetInnerHTML={{ __html: highlightText(order.displayCode) }}
                                />
                                {order.table !== 'NO_TABLE_PRESET' && (
                                    <span
                                        className="text-sm text-muted-foreground truncate max-w-30"
                                        dangerouslySetInnerHTML={{ __html: highlightText(`${t('dailyOrderCard.tablePrefix')} ${order.table}`) }}
                                    />
                                )}
                            </div>
                            <p
                                className="text-sm font-medium truncate max-w-45"
                                dangerouslySetInnerHTML={{ __html: highlightText(order.customer) }}
                            />
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleString('it-IT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {getStatusBadge(order.status)}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-amber-600">
                                {parseFloat(order.total).toFixed(2)} €
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 select-none cursor-pointer"
                            onClick={onViewDetail}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('dailyOrderCard.view')}
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 select-none cursor-pointer"
                            onClick={onLoadToCart}
                            disabled={!isPending}
                            title={!isPending ? t('dailyOrderCard.tooltipLoadOnlyPending') : ''}
                        >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            {t('dailyOrderCard.load')}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="select-none cursor-pointer"
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={!isConfirmed}
                            title={!isConfirmed ? t('dailyOrderCard.tooltipCancelOnlyConfirmed') : ''}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('dailyOrderCard.cancelDialogTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dailyOrderCard.cancelDialogDesc', { displayCode: order.displayCode })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('dailyOrderCard.cancelDialogCancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                setCancelDialogOpen(false);
                                onCancelOrder();
                            }}
                        >
                            {t('dailyOrderCard.cancelDialogConfirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
