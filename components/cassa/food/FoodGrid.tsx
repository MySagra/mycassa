"use client";

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import { Category, Food } from '@/lib/api-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FoodCard } from './FoodCard';

const LS_KEY = 'foodgrid_hide_unavailable';

interface FoodGridProps {
    foods: Food[];
    categories: Category[];
    selectedCategoryId: number | null;
    onAddToCart: (food: Food) => void;
    loading: boolean;
    showDailyOrders: boolean;
    foodSearchQuery?: string;
    onFoodSearchChange?: (value: string) => void;
}

export function FoodGrid({ foods, categories, selectedCategoryId, onAddToCart, loading, showDailyOrders, foodSearchQuery = '', onFoodSearchChange }: FoodGridProps) {
    const { t } = useTranslation();
    const isSearching = foodSearchQuery.trim() !== '';

    const [hideUnavailable, setHideUnavailable] = useState<Record<string, boolean>>(() => {
        try {
            const stored = localStorage.getItem(LS_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const toggleHideUnavailable = useCallback((categoryName: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHideUnavailable(prev => {
            const next = { ...prev, [categoryName]: !prev[categoryName] };
            try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
            return next;
        });
    }, []);

    // Filter foods by category, then optionally by search query
    const filteredFoods = (() => {
        let result = selectedCategoryId
            ? foods.filter((food) => food.categoryId === selectedCategoryId)
            : foods;

        if (isSearching) {
            result = result.filter((food) =>
                food.name.toLowerCase().includes(foodSearchQuery.toLowerCase())
            );
        }

        return result;
    })();

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

    const categoriesWithUnavailable = selectedCategoryId === null
        ? Object.entries(sortedFoodsByCategory)
            .filter(([, categoryFoods]) => categoryFoods.some(f => f.available === false))
            .map(([name]) => name)
        : [];

    const allHiding = categoriesWithUnavailable.length > 0 &&
        categoriesWithUnavailable.every(name => !!hideUnavailable[name]);

    const toggleAllUnavailable = () => {
        setHideUnavailable(prev => {
            const next = { ...prev };
            if (allHiding) {
                categoriesWithUnavailable.forEach(name => { delete next[name]; });
            } else {
                categoriesWithUnavailable.forEach(name => { next[name] = true; });
            }
            try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* noop */ }
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-muted-foreground">Caricamento cibi...</div>
            </div>
        );
    }

    const gridCols = showDailyOrders
        ? "grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    return (
        <ScrollArea className="h-full">
            {onFoodSearchChange && (
                <div className="sticky top-0 z-10 flex items-center gap-2 px-6 py-3 border-b bg-background">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={foodSearchQuery}
                            onChange={(e) => onFoodSearchChange(e.target.value)}
                            placeholder={t('header.searchFood')}
                            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        {foodSearchQuery && (
                            <button
                                onClick={() => onFoodSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleAllUnavailable}
                                disabled={categoriesWithUnavailable.length === 0}
                                className={`flex items-center justify-center gap-1.5 h-9 w-52 rounded-md border text-sm font-medium transition-colors shrink-0 ${
                                    categoriesWithUnavailable.length === 0
                                        ? 'opacity-40 cursor-not-allowed bg-background border-input text-muted-foreground'
                                        : allHiding
                                            ? 'cursor-pointer bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:border-amber-600/60 dark:text-amber-400 dark:hover:bg-amber-900/60'
                                            : 'cursor-pointer bg-background border-input text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                            >
                                {allHiding ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
                                <span className="truncate">{allHiding ? t('foods.showUnavailable') : t('foods.hideUnavailable')}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {t('foods.toggleUnavailable')}
                        </TooltipContent>
                    </Tooltip>
                </div>
            )}
            <div className="space-y-4 p-6">
            <div className="space-y-4">
                {selectedCategoryId === null ? (
                    <div className="space-y-4">
                        {Object.entries(sortedFoodsByCategory)
                            .filter(([categoryName]) => {
                                const cat = categories.find((c) => c.name === categoryName);
                                return cat ? cat.available !== false : true;
                            })
                            .map(([categoryName, categoryFoods]) => {
                                const hiding = !!hideUnavailable[categoryName];
                                const visibleFoods = hiding
                                    ? categoryFoods.filter(f => f.available !== false)
                                    : categoryFoods;
                                const hasUnavailable = categoryFoods.some(f => f.available === false);

                                return (
                                <Accordion
                                    key={categoryName}
                                    type="single"
                                    collapsible
                                    className="w-full bg-card/60 rounded-lg border"
                                    defaultValue={categoryName}
                                    value={isSearching ? categoryName : undefined}
                                >
                                    <AccordionItem value={categoryName} className="border-none select-none">
                                        <AccordionTrigger
                                            className="px-4 py-3 cursor-pointer hover:no-underline"
                                            extra={
                                                hasUnavailable ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                className="mr-3 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                                                onClick={(e) => toggleHideUnavailable(categoryName, e)}
                                                            >
                                                                {hiding
                                                                    ? <EyeOff className="size-4" />
                                                                    : <Eye className="size-4" />
                                                                }
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            {t('foods.toggleUnavailable')}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : null
                                            }
                                        >
                                            <h2 className="text-xl font-semibold">{categoryName.toUpperCase()}</h2>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4">
                                            <div className={`grid ${gridCols} gap-3`}>
                                                {visibleFoods.map((food) => (
                                                    <FoodCard
                                                        key={food.id}
                                                        food={food}
                                                        onClick={() => onAddToCart(food)}
                                                        searchQuery={foodSearchQuery}
                                                    />
                                                ))}
                                            </div>
                                            {visibleFoods.length === 0 && (
                                                <p className="text-sm text-muted-foreground text-center py-2">
                                                    Nessun cibo disponibile
                                                </p>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                                );
                            })}
                        {isSearching && filteredFoods.length === 0 && (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                Nessun cibo trovato per &ldquo;{foodSearchQuery}&rdquo;
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`grid ${gridCols} gap-3`}>
                            {filteredFoods.map((food) => (
                                <FoodCard
                                    key={food.id}
                                    food={food}
                                    onClick={() => onAddToCart(food)}
                                    searchQuery={foodSearchQuery}
                                />
                            ))}
                        </div>
                        {isSearching && filteredFoods.length === 0 && (
                            <div className="flex h-32 items-center justify-center text-muted-foreground">
                                Nessun cibo trovato per &ldquo;{foodSearchQuery}&rdquo;
                            </div>
                        )}
                    </>
                )}
            </div>
            </div>
        </ScrollArea>
    );
}
