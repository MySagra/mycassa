'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { Check, CheckCheck } from 'lucide-react';
import { DailyOrder } from '@/lib/cassa/types';
import { DailyOrderCard } from '@/components/cassa/daily-orders/DailyOrderCard';
import { useTranslation } from 'react-i18next';

interface MobileVerificaDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orders: DailyOrder[];
    searchQuery: string;
    loading: boolean;
    showAllOrders: boolean;
    onSearchChange: (value: string) => void;
    onViewDetail: (orderId: string) => void;
    onLoadToCart: (order: DailyOrder) => void;
    onCancelOrder: (orderId: string) => void;
    onToggleAllOrders: () => void;
}

export function MobileVerificaDrawer({
    open,
    onOpenChange,
    orders,
    searchQuery,
    loading,
    showAllOrders,
    onSearchChange,
    onViewDetail,
    onLoadToCart,
    onCancelOrder,
    onToggleAllOrders,
}: MobileVerificaDrawerProps) {
    const { t } = useTranslation();

    return (
        <Drawer open={open} onOpenChange={(val) => { if (!val) (document.activeElement as HTMLElement)?.blur(); onOpenChange(val); }}>
            <DrawerContent className="flex flex-col h-[88dvh]">
                <DrawerHeader className="pb-2 shrink-0">
                    <DrawerTitle>{t('dailyOrders.title')}</DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pb-3 shrink-0 flex items-center gap-2">
                    <Input
                        autoComplete="off"
                        placeholder={t('dailyOrders.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1"
                    />
                    <Toggle
                        variant="outline"
                        pressed={showAllOrders}
                        onPressedChange={onToggleAllOrders}
                        aria-label={t('dailyOrders.showAllOrders')}
                        className="shrink-0"
                    >
                        {showAllOrders ? (
                            <CheckCheck className="h-4 w-4" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                    </Toggle>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3 pt-3">
                    {orders.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 text-sm select-none">
                            {loading ? t('dailyOrders.loading') : t('dailyOrders.noOrders')}
                        </p>
                    ) : (
                        orders.map((order) => (
                            <DailyOrderCard
                                key={order.id}
                                order={order}
                                searchQuery={searchQuery}
                                onViewDetail={() => onViewDetail(order.id)}
                                onLoadToCart={() => {
                                    onLoadToCart(order);
                                    onOpenChange(false);
                                }}
                                onCancelOrder={() => onCancelOrder(order.id)}
                            />
                        ))
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
