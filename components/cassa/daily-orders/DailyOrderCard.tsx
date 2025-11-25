import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, ShoppingCart } from 'lucide-react';
import { DailyOrder } from '@/lib/cassa/types';

interface DailyOrderCardProps {
    order: DailyOrder;
    onViewDetail: () => void;
    onLoadToCart: () => void;
    searchQuery: string; // Added searchQuery prop
}

export function DailyOrderCard({ order, onViewDetail, onLoadToCart, searchQuery }: DailyOrderCardProps) {
    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<span class="bg-amber-500 rounded px-0.25 ">$1</span>');
    };

    return (
        <Card className="border hover:border-amber-500 transition-colors">
            <CardContent className="space-y-3">
                <div className="flex items-start justify-between">
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
                        <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">
                            {parseFloat(order.subTotal).toFixed(2)} €
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 select-none"
                        onClick={onViewDetail}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizza
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-amber-500 hover:bg-amber-600 select-none"
                        onClick={onLoadToCart}
                    >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Carica
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
