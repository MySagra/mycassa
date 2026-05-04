import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyOrder } from '@/lib/cassa/types';
import { DailyOrderCard } from './DailyOrderCard';
import { Check, CheckCheck } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface DailyOrdersSidebarProps {
    orders: DailyOrder[];
    searchQuery: string;
    loading: boolean;
    showAllOrders: boolean;
    onSearchChange: (query: string) => void;
    onViewDetail: (orderId: string) => void;
    onLoadToCart: (order: DailyOrder) => void;
    onCancelOrder: (orderId: string) => void;
    onToggleAllOrders: () => void;
}

export function DailyOrdersSidebar({
    orders,
    searchQuery,
    loading,
    showAllOrders,
    onSearchChange,
    onViewDetail,
    onLoadToCart,
    onCancelOrder,
    onToggleAllOrders,
}: DailyOrdersSidebarProps) {
    const { t } = useTranslation();

    return (
        <aside className="w-96 border-l flex flex-col bg-card h-screen animate-in">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold select-none">{t('dailyOrders.title')}</h2>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Toggle
                                    variant="outline"
                                    pressed={showAllOrders}
                                    onPressedChange={onToggleAllOrders}
                                    aria-label={t('dailyOrders.showAllOrders')}
                                >
                                    {showAllOrders ? (
                                        <CheckCheck className="h-4 w-4" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                </Toggle>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{showAllOrders ? t('dailyOrders.tooltipAll') : t('dailyOrders.tooltipPending')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {/* Search Section */}
                <div>
                    <Label htmlFor="searchQuery" className="mb-2">{t('dailyOrders.searchOrder')}</Label>
                    <div className="mt-1">
                        <Input
                            autoComplete='off'
                            id="searchQuery"
                            placeholder={t('dailyOrders.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 h-full bg-background/60 pb-16 overflow-y-auto">
                <div className="p-4 space-y-3">
                    {orders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 select-none">
                            {loading ? t('dailyOrders.loading') : t('dailyOrders.noOrders')}
                        </div>
                    ) : (
                        orders.map((order) => (
                            <DailyOrderCard
                                key={order.id}
                                order={order}
                                searchQuery={searchQuery}
                                onViewDetail={() => onViewDetail(order.id)}
                                onLoadToCart={() => onLoadToCart(order)}
                                onCancelOrder={() => onCancelOrder(order.id)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
