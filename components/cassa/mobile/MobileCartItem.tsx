'use client';

import { ExtendedCartItem, Ingredient } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Minus, Plus, AlertTriangle } from 'lucide-react';
import { calculateIngredientSurcharge } from '@/lib/cassa/calculations';
import { useTranslation } from 'react-i18next';

interface MobileCartItemProps {
    item: ExtendedCartItem;
    allIngredients: Ingredient[];
    onUpdateQuantity: (delta: number) => void;
    onRemove: () => void;
    onEdit: () => void;
}

export function MobileCartItem({ item, allIngredients, onUpdateQuantity, onRemove, onEdit }: MobileCartItemProps) {
    const itemPrice = typeof item.food.price === 'number'
        ? item.food.price
        : parseFloat(item.food.price as unknown as string);
    const itemSurcharge = calculateIngredientSurcharge(item);
    const itemTotal = (itemPrice * item.quantity) + itemSurcharge;
    const isUnavailable = item.food.available === false;
    const { t } = useTranslation();

    return (
        <div className={`bg-card border rounded-lg p-3 ${isUnavailable ? 'border-destructive/60 bg-destructive/5' : ''}`}>
            {isUnavailable && (
                <div className="flex items-center gap-1 mb-2 text-xs text-destructive font-medium">
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    <span>{t('cartItem.unavailable')}</span>
                </div>
            )}

            <div className="flex items-start justify-between gap-2 mb-2">
                {/* Name + pencil inline */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 cursor-pointer text-amber-500 hover:text-amber-600"
                            onClick={onEdit}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <h4 className={`font-medium text-sm select-none truncate ${isUnavailable ? 'line-through text-muted-foreground' : ''}`}>
                            {item.food.name}
                        </h4>
                    </div>
                    {item.ingredientQuantities && item.food.ingredients && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                            {item.food.ingredients
                                .map((ing) => {
                                    const qty = item.ingredientQuantities?.[ing.id] ?? 1;
                                    if (qty === 0) return `NO ${ing.name}`;
                                    if (qty > 1) return `${qty}x ${ing.name}`;
                                    return null;
                                })
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                    )}
                    {item.extraIngredients && Object.keys(item.extraIngredients).length > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                            {Object.entries(item.extraIngredients)
                                .map(([id, qty]) => {
                                    const name = allIngredients.find((i) => i.id === id)?.name ?? id;
                                    return qty === 1 ? `+${name}` : `+${qty} ${name}`;
                                })
                                .join(', ')}
                        </p>
                    )}
                    {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                </div>

                {/* Delete button — top right, bigger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-destructive cursor-pointer hover:bg-destructive/10"
                    onClick={onRemove}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 cursor-pointer"
                        onClick={() => onUpdateQuantity(-1)}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium select-none">{item.quantity}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 cursor-pointer"
                        onClick={() => onUpdateQuantity(1)}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-right">
                    {itemSurcharge > 0 && (
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                            (+{(itemSurcharge / item.quantity).toFixed(2)}€)
                        </p>
                    )}
                    <p className="text-lg font-bold select-none">{itemTotal.toFixed(2)} €</p>
                </div>
            </div>
        </div>
    );
}
