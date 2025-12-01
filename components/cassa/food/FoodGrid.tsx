import { Category, Food } from '@/lib/api-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FoodCard } from './FoodCard';

interface FoodGridProps {
    foods: Food[];
    categories: Category[];
    selectedCategoryId: number | null;
    onAddToCart: (food: Food) => void;
    loading: boolean;
}

export function FoodGrid({ foods, categories, selectedCategoryId, onAddToCart, loading }: FoodGridProps) {
    // Filter foods by category
    const filteredFoods = selectedCategoryId
        ? foods.filter((food) => food.categoryId === selectedCategoryId)
        : foods;

    // Group foods by category and sort categories by position
    const foodsByCategory = filteredFoods.reduce((acc, food) => {
        const categoryName = food.category?.name || 'Altro';
        if (!acc[categoryName]) {
            acc[categoryName] = [];
        }
        acc[categoryName].push(food);
        return acc;
    }, {} as Record<string, Food[]>);

    // Sort foods within each category alphabetically
    const sortedFoodsByCategory = Object.keys(foodsByCategory)
        .sort((a, b) => {
            const categoryA = categories.find((cat) => cat.name === a);
            const categoryB = categories.find((cat) => cat.name === b);
            return (categoryA?.position || 0) - (categoryB?.position || 0);
        })
        .reduce((acc, key) => {
            acc[key] = foodsByCategory[key].sort((foodA, foodB) => foodA.name.localeCompare(foodB.name));
            return acc;
        }, {} as Record<string, Food[]>);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-muted-foreground">Caricamento cibi...</div>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="space-y-8 p-6">
                {selectedCategoryId === null ? (
                    <div className="space-y-4">
                        {Object.entries(sortedFoodsByCategory).map(([categoryName, categoryFoods]) => (
                            <Accordion
                                key={categoryName}
                                type="single"
                                collapsible
                                className="w-full bg-card rounded-lg border"
                                defaultValue={categoryName}
                            >
                                <AccordionItem value={categoryName} className="border-none select-none">
                                    <AccordionTrigger className="px-4 py-3 cursor-pointer hover:no-underline">
                                        <h2 className="text-xl font-semibold">{categoryName.toUpperCase()}</h2>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                            {categoryFoods.map((food) => (
                                                <FoodCard
                                                    key={food.id}
                                                    food={food}
                                                    onClick={() => onAddToCart(food)}
                                                />
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredFoods.map((food) => (
                            <FoodCard
                                key={food.id}
                                food={food}
                                onClick={() => onAddToCart(food)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ScrollArea>
    );
}
