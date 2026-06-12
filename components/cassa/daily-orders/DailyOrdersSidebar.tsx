import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyOrder } from '@/lib/cassa/types';
import { DailyOrderCard } from './DailyOrderCard';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/lib/contexts/EnvContext';
import { useState } from 'react';

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
    onClose: () => void;
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
    onClose,
}: DailyOrdersSidebarProps) {
    const { t } = useTranslation();
    const { showNumbers } = useEnv();
    const [localInput, setLocalInput] = useState(searchQuery);

    const handleSearch = () => {
        onSearchChange(localInput);
    };

    return (
        <aside className="w-96 border-l flex flex-col bg-card h-screen animate-in">
            <div className="p-4 border-b">
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-semibold select-none">{t('dailyOrders.title')}</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-7 w-7 cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleAllOrders}
                            className="text-xs font-semibold px-3 h-8 cursor-pointer gap-2"
                        >
                            <span className={!showAllOrders ? 'text-amber-500 font-bold' : 'text-muted-foreground'}>
                                {t('dailyOrders.filterPending')}
                            </span>
                            <ArrowLeftRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className={showAllOrders ? 'text-amber-500 font-bold' : 'text-muted-foreground'}>
                                {t('dailyOrders.filterAll')}
                            </span>
                        </Button>
                    </div>
                </div>
                {/* Search Section */}
                <div>
                    <Label htmlFor="searchQuery" className="mb-2">{t('dailyOrders.searchOrder')}</Label>
                    <div className="mt-1 flex gap-2">
                        <Input
                            autoComplete='off'
                            id="searchQuery"
                            placeholder={showNumbers ? t('dailyOrders.searchPlaceholder') + ', numero...' : t('dailyOrders.searchPlaceholder')}
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleSearch}
                            className="shrink-0 cursor-pointer"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
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
                        <>
                            {orders.map((order) => (
                                <DailyOrderCard
                                    key={order.id}
                                    order={order}
                                    searchQuery={searchQuery}
                                    onViewDetail={() => onViewDetail(order.id)}
                                    onLoadToCart={() => onLoadToCart(order)}
                                    onCancelOrder={() => onCancelOrder(order.id)}
                                />
                            ))}
                            {showAllOrders && (
                                <p className="text-center text-xs text-muted-foreground pt-2 pb-1 select-none">
                                    {t('dailyOrders.last20Orders')}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
