import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart } from 'lucide-react';
import { DailyOrder } from '@/lib/cassa/types';
import { useRef, useEffect } from 'react';

interface DailyOrderCardProps {
    order: DailyOrder;
    onViewDetail: () => void;
    onLoadToCart: () => void;
    searchQuery: string; // Added searchQuery prop
}

const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
        PENDING: { label: 'In attesa', className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
        CONFIRMED: { label: 'Confermato', className: 'bg-green-500/20 text-green-700 dark:text-green-400' },
        COMPLETED: { label: 'Completato', className: 'bg-pink-500/20 text-pink-700 dark:text-pink-400' },
        PICKED_UP: { label: 'Ritirato', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' }
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
            {statusInfo.label}
        </span>
    );
};

export function DailyOrderCard({ order, onViewDetail, onLoadToCart, searchQuery }: DailyOrderCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Add focus ring animation when card is first mounted
    useEffect(() => {
        if (cardRef.current) {
            cardRef.current.classList.add('ring-2', 'ring-amber-500');

            const timer = setTimeout(() => {
                if (cardRef.current) {
                    cardRef.current.classList.remove('ring-2', 'ring-amber-500');
                }
            }, 1500); // 1.5 seconds

            return () => clearTimeout(timer);
        }
    }, []);

    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<span class="bg-amber-500 rounded px-0.5 ">$1</span>');
    };

    const isPending = order.status === 'PENDING';

    return (
        <Card ref={cardRef} className="border hover:border-amber-500 transition-all duration-300">
            <CardContent className="space-y-3">
                <div className="flex items-start justify-between select-none">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span
                                className="font-mono font-bold text-lg text-amber-600"
                                dangerouslySetInnerHTML={{ __html: highlightText(order.displayCode) }}
                            />
                            <span
                                className="text-sm text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: highlightText(`Tavolo ${order.table}`) }}
                            />
                        </div>
                        <p
                            className="text-sm font-medium"
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
                        Visualizza
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1 select-none cursor-pointer"
                        onClick={onLoadToCart}
                        disabled={!isPending}
                        title={!isPending ? 'Solo gli ordini in attesa possono essere caricati' : ''}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Carica
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
