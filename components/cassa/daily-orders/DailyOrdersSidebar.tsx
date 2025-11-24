import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyOrder } from '@/lib/cassa/types';
import { DailyOrderCard } from './DailyOrderCard';

interface DailyOrdersSidebarProps {
    orders: DailyOrder[];
    searchQuery: string;
    loading: boolean;
    onSearchChange: (query: string) => void;
    onViewDetail: (displayCode: string) => void;
    onLoadToCart: (order: DailyOrder) => void;
}

export function DailyOrdersSidebar({
    orders,
    searchQuery,
    loading,
    onSearchChange,
    onViewDetail,
    onLoadToCart
}: DailyOrdersSidebarProps) {
    return (
        <aside className="w-96 border-l flex flex-col bg-card h-screen animate-in">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-4">Ordini Giornalieri</h2>

                {/* Search Section */}
                <div>
                    <Label htmlFor="searchQuery" className="mb-2">Cerca Ordine</Label>
                    <div className="mt-1">
                        <Input
                            autoComplete='off'
                            id="searchQuery"
                            placeholder="Cerca per codice, tavolo o cliente..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 h-full overflow-y-auto">
                <div className="p-4 space-y-3">
                    {orders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            {loading ? 'Caricamento ordini...' : 'Nessun ordine trovato per oggi'}
                        </div>
                    ) : (
                        orders.map((order) => (
                            <DailyOrderCard
                                key={order.id}
                                order={order}
                                onViewDetail={() => onViewDetail(order.displayCode)}
                                onLoadToCart={() => onLoadToCart(order)}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
