import { ExtendedCartItem } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { Pencil, X, Minus, Plus } from 'lucide-react';
import { calculateIngredientSurcharge } from '@/lib/cassa/calculations';

interface CartItemProps {
    item: ExtendedCartItem;
    onUpdateQuantity: (delta: number) => void;
    onRemove: () => void;
    onEdit: () => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove, onEdit }: CartItemProps) {
    const itemPrice = (typeof item.food.price === 'number'
        ? item.food.price
        : parseFloat(item.food.price as unknown as string));
    const itemSurcharge = calculateIngredientSurcharge(item);
    const itemTotal = (itemPrice * item.quantity) + itemSurcharge;

    return (
        <div className="bg-card border rounded-lg p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                    <h4 className="font-medium text-sm select-none">{item.food.name}</h4>
                    {item.ingredientQuantities && item.food.ingredients && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                            {item.food.ingredients
                                .map((ing) => {
                                    const qty = item.ingredientQuantities?.[ing.id] ?? 1;
                                    if (qty === 0) {
                                        return `NO ${ing.name}`;
                                    } else if (qty > 1) {
                                        return `${qty}x ${ing.name}`;
                                    }
                                    return null;
                                })
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                    )}
                    {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={onEdit}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={onRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(-1)}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium select-none">{item.quantity}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
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
