import { Food } from '@/lib/api-types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FoodCardProps {
    food: Food;
    onClick: () => void;
}

export function FoodCard({ food, onClick }: FoodCardProps) {
    const price = typeof food.price === 'number'
        ? food.price
        : parseFloat(food.price as unknown as string);

    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${!food.available ? 'opacity-50' : ''}`}
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
                    {food.name}
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
