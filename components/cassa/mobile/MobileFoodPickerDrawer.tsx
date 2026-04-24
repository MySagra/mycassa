'use client';

import { useState } from 'react';
import { Food, Category } from '@/lib/api-types';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Minus, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface MobileFoodPickerDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    foods: Food[];
    categories: Category[];
    onAddToCart: (food: Food) => void;
}

export function MobileFoodPickerDrawer({
    open,
    onOpenChange,
    foods,
    categories,
    onAddToCart,
}: MobileFoodPickerDrawerProps) {
    const [search, setSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const { t } = useTranslation();

    const filtered = search.trim()
        ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
        : foods;

    const grouped = categories
        .map((cat) => ({
            category: cat,
            foods: filtered.filter((f) => f.categoryId === cat.id),
        }))
        .filter((g) => g.foods.length > 0);

    const totalSelected = Object.values(selectedItems).reduce((s, q) => s + q, 0);

    const toggleFood = (food: Food) => {
        setSelectedItems((prev) => {
            if (prev[food.id] !== undefined) {
                const { [food.id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [food.id]: 1 };
        });
    };

    const updateQty = (foodId: string, delta: number) => {
        setSelectedItems((prev) => {
            const newQty = (prev[foodId] ?? 1) + delta;
            if (newQty <= 0) {
                const { [foodId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [foodId]: newQty };
        });
    };

    const handleSave = () => {
        Object.entries(selectedItems).forEach(([foodId, qty]) => {
            const food = foods.find((f) => f.id === foodId);
            if (!food) return;
            for (let i = 0; i < qty; i++) onAddToCart(food);
        });
        setSelectedItems({});
        handleClose(false);
    };

    const handleCancel = () => handleClose(false);

    const handleClose = (val: boolean) => {
        if (!val) {
            (document.activeElement as HTMLElement)?.blur();
            setSearch('');
            setSelectedItems({});
        }
        onOpenChange(val);
    };

    return (
        <Drawer open={open} onOpenChange={handleClose}>
            <DrawerContent className="flex flex-col h-[88dvh]">
                <DrawerHeader className="pb-2 shrink-0">
                    <DrawerTitle>{t('mobile.foodPicker.title')}</DrawerTitle>
                </DrawerHeader>

                <div className="px-4 pb-3 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder={t('header.searchFood')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9"
                            autoComplete="off"
                        />
                        {search && (
                            <button
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                onClick={() => setSearch('')}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
                    {grouped.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t('mobile.foodPicker.noResults')}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {grouped.map(({ category, foods: catFoods }) => (
                                <div key={category.id}>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                        {category.name}
                                    </p>
                                    <div className="space-y-1.5">
                                        {catFoods.map((food) => {
                                            const price = typeof food.price === 'number'
                                                ? food.price
                                                : parseFloat(food.price as unknown as string);
                                            const qty = selectedItems[food.id];
                                            const isSelected = qty !== undefined;

                                            return (
                                                <div
                                                    key={food.id}
                                                    className={cn(
                                                        'flex items-center justify-between px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                                                        !food.available && 'opacity-50',
                                                        isSelected && 'border-amber-500 bg-amber-500/5'
                                                    )}
                                                    onClick={() => toggleFood(food)}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{food.name}</p>
                                                        <p className="text-xs text-amber-500 font-semibold">
                                                            {price.toFixed(2)} €
                                                        </p>
                                                    </div>

                                                    {isSelected && (
                                                        <div
                                                            className="flex items-center gap-1.5 shrink-0 ml-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 cursor-pointer"
                                                                onClick={() => updateQty(food.id, -1)}
                                                            >
                                                                <Minus className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <span className="w-6 text-center font-semibold text-sm select-none">
                                                                {qty}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 cursor-pointer"
                                                                onClick={() => updateQty(food.id, 1)}
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 p-4 border-t shrink-0">
                    <Button
                        variant="outline"
                        className="flex-1 h-11 cursor-pointer"
                        onClick={handleCancel}
                    >
                        {t('cartSidebar.cancel')}
                    </Button>
                    <Button
                        className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 cursor-pointer"
                        onClick={handleSave}
                        disabled={totalSelected === 0}
                    >
                        {t('mobile.foodPicker.addButton')} {totalSelected > 0 && `(${totalSelected})`}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
