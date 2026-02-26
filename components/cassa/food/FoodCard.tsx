import { Food } from '@/lib/api-types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FoodCardProps {
    food: Food;
    onClick: () => void;
    searchQuery?: string;
}

function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-amber-300 text-amber-900 rounded-sm px-0.5 not-italic">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export function FoodCard({ food, onClick, searchQuery = '' }: FoodCardProps) {
    const price = typeof food.price === 'number'
        ? food.price
        : parseFloat(food.price as unknown as string);

    const isMatch = searchQuery.trim() !== '' &&
        food.name.toLowerCase().includes(searchQuery.toLowerCase());

    return (
        <Card
            className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                !food.available ? 'opacity-50' : ''
            )}
            onClick={onClick}
        >
            <CardContent className="">
                <h3
                    className={cn(
                        "font-semibold text-sm mb-1 truncate select-none",
                        food.name.length < 15 ? "text-xl" : ""
                    )}
                    title={food.name}
                >
                    <HighlightText text={food.name} query={searchQuery} />
                </h3>
                <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-amber-500 select-none">
                        {price.toFixed(2)} €
                    </span>
                    {!food.available && (
                        <span className="text-[10px] text-red-500 font-medium">Non disp.</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
