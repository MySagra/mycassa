'use client';

import { useState, useEffect } from 'react';
import { ExtendedCartItem, Ingredient } from '@/lib/api-types';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileEditItemDrawerProps {
    item: ExtendedCartItem | null;
    open: boolean;
    onClose: () => void;
    onSave: (
        quantity: number,
        notes: string,
        ingredientQuantities: Record<string, number>,
        extraIngredients: Record<string, number>
    ) => void;
    allIngredients?: Ingredient[];
}

export function MobileEditItemDrawer({
    item,
    open,
    onClose,
    onSave,
    allIngredients = [],
}: MobileEditItemDrawerProps) {
    const [editQuantity, setEditQuantity] = useState(1);
    const [editNotes, setEditNotes] = useState('');
    const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>({});
    const [extraIngredients, setExtraIngredients] = useState<Record<string, number>>({});
    const [extraSearch, setExtraSearch] = useState('');
    const { t } = useTranslation();

    const foodIngredientIds = new Set(item?.food.ingredients?.map((i) => i.id) ?? []);
    const availableExtras = allIngredients.filter((i) => !foodIngredientIds.has(i.id));

    useEffect(() => {
        if (item) {
            setEditQuantity(1);
            setEditNotes(item.notes || '');
            const initialQuantities: Record<string, number> = {};
            item.food.ingredients?.forEach((ingredient) => {
                initialQuantities[ingredient.id] = item.ingredientQuantities?.[ingredient.id] ?? 1;
            });
            setIngredientQuantities(initialQuantities);
            setExtraIngredients(item.extraIngredients ? { ...item.extraIngredients } : {});
            setExtraSearch('');
        }
    }, [item]);

    const updateIngredientQuantity = (ingredientId: string, delta: number) => {
        setIngredientQuantities((prev) => ({
            ...prev,
            [ingredientId]: Math.max(0, (prev[ingredientId] ?? 1) + delta),
        }));
    };

    const updateExtraIngredientQuantity = (ingredientId: string, delta: number) => {
        setExtraIngredients((prev) => {
            const newQty = (prev[ingredientId] ?? 1) + delta;
            if (newQty <= 0) {
                const { [ingredientId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [ingredientId]: newQty };
        });
    };

    const toggleExtraIngredient = (ingredientId: string) => {
        setExtraIngredients((prev) => {
            if (prev[ingredientId] !== undefined) {
                const { [ingredientId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [ingredientId]: 1 };
        });
    };

    if (!item) return null;

    const hasIngredients = (item.food.ingredients?.length ?? 0) > 0;
    const hasExtras = Object.keys(extraIngredients).length > 0;
    const filteredExtras = availableExtras.filter((i) =>
        i.name.toLowerCase().includes(extraSearch.toLowerCase())
    );

    return (
        <Drawer open={open} onOpenChange={(isOpen) => { if (!isOpen) { (document.activeElement as HTMLElement)?.blur(); onClose(); } }}>
            <DrawerContent className="flex flex-col" style={{ maxHeight: '92dvh' }}>
                <DrawerHeader className="pb-2">
                    <DrawerTitle>{t('editItemDialog.title')}</DrawerTitle>
                    <DrawerDescription>{item.food.name}</DrawerDescription>
                </DrawerHeader>

                <ScrollArea className="flex-1 min-w-0 px-4">
                    <div className="space-y-4 pb-2">

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <Label className='mb-4'>{t('editItemDialog.quantityPrompt')}</Label>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 cursor-pointer shrink-0"
                                    onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="flex-1 text-center text-xl font-bold select-none">
                                    {editQuantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 cursor-pointer shrink-0"
                                    onClick={() => setEditQuantity(Math.min(item.quantity, editQuantity + 1))}
                                    disabled={editQuantity >= item.quantity}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                {t('editItemDialog.quantityHint', { max: item.quantity })}
                            </p>
                        </div>

                        {/* Existing ingredients + selected extras */}
                        {(hasIngredients || hasExtras) && (
                            <div className="space-y-1.5">
                                <Label className='mb-4'>{t('editItemDialog.ingredients')}</Label>
                                <div className="border rounded-lg divide-y">
                                    {item.food.ingredients?.map((ingredient) => {
                                        const qty = ingredientQuantities[ingredient.id] ?? 1;
                                        return (
                                            <div key={ingredient.id} className="flex items-center justify-between px-3 py-2">
                                                <span className="text-sm font-medium">{ingredient.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer"
                                                        onClick={() => updateIngredientQuantity(ingredient.id, -1)}
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <span className="w-6 text-center font-semibold select-none text-sm">{qty}</span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer"
                                                        onClick={() => updateIngredientQuantity(ingredient.id, 1)}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {Object.entries(extraIngredients).map(([id, qty]) => {
                                        const ingredient = allIngredients.find((i) => i.id === id);
                                        if (!ingredient) return null;
                                        return (
                                            <div key={id} className="flex items-center justify-between px-3 py-2">
                                                <span className="text-sm font-medium text-amber-500">{ingredient.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer"
                                                        onClick={() => updateExtraIngredientQuantity(id, -1)}
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <span className="w-6 text-center font-semibold select-none text-sm">{qty}</span>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 cursor-pointer"
                                                        onClick={() => updateExtraIngredientQuantity(id, 1)}
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {t('editItemDialog.ingredientsHint')}
                                </p>
                            </div>
                        )}

                        {/* Add extra ingredients - search bar only, results appear while typing */}
                        {availableExtras.length > 0 && hasIngredients && (
                            <div className="space-y-1.5">
                                <Label className='mb-4'>{t('editItemDialog.addIngredients')}</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder={t('editItemDialog.searchPlaceholder')}
                                        value={extraSearch}
                                        onChange={(e) => setExtraSearch(e.target.value)}
                                        className="pl-8 h-8 text-sm"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>
                                {extraSearch.trim().length > 0 && (
                                    <div className="pt-1">
                                        {filteredExtras.length === 0 ? (
                                            <p className="text-xs text-muted-foreground">{t('mobile.editItem.noIngredientFound')}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 overflow-hidden" style={{ maxHeight: '2rem' }}>
                                                {filteredExtras.map((ingredient) => {
                                                    const isSelected = extraIngredients[ingredient.id] !== undefined;
                                                    return (
                                                        <Badge
                                                            key={ingredient.id}
                                                            variant={isSelected ? 'default' : 'outline'}
                                                            className="cursor-pointer select-none py-1 px-2.5"
                                                            onClick={() => {
                                                                toggleExtraIngredient(ingredient.id);
                                                                setExtraSearch('');
                                                            }}
                                                        >
                                                            {ingredient.name}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label htmlFor="mobile-notes">{t('editItemDialog.note')}</Label>
                            <Textarea
                                id="mobile-notes"
                                placeholder={t('editItemDialog.notePlaceholder')}
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    </div>
                </ScrollArea>

                {/* Sticky footer */}
                <div className="flex gap-3 p-4 border-t shrink-0">
                    <Button variant="outline" className="flex-1 h-11 cursor-pointer" onClick={onClose}>
                        {t('editItemDialog.cancel')}
                    </Button>
                    <Button
                        className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 cursor-pointer"
                        onClick={() => onSave(editQuantity, editNotes, ingredientQuantities, extraIngredients)}
                    >
                        {t('editItemDialog.save')}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
