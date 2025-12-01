import { useState, useEffect } from 'react';
import { ExtendedCartItem } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus } from 'lucide-react';

interface EditItemDialogProps {
    item: ExtendedCartItem | null;
    open: boolean;
    onClose: () => void;
    onSave: (quantity: number, notes: string, ingredientQuantities: Record<string, number>) => void;
}

export function EditItemDialog({ item, open, onClose, onSave }: EditItemDialogProps) {
    const [editQuantity, setEditQuantity] = useState(1);
    const [editNotes, setEditNotes] = useState('');
    const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>({});

    useEffect(() => {
        if (item) {
            setEditQuantity(1);
            setEditNotes(item.notes || '');
            // Initialize ingredient quantities: default to 1 for all ingredients
            const initialQuantities: Record<string, number> = {};
            item.food.ingredients?.forEach((ingredient) => {
                initialQuantities[ingredient.id] = item.ingredientQuantities?.[ingredient.id] ?? 1;
            });
            setIngredientQuantities(initialQuantities);
        }
    }, [item]);

    const updateIngredientQuantity = (ingredientId: string, delta: number) => {
        setIngredientQuantities((prev) => {
            const currentQty = prev[ingredientId] ?? 1;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [ingredientId]: newQty };
        });
    };

    const handleSave = () => {
        onSave(editQuantity, editNotes, ingredientQuantities);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Modifica Prodotto</DialogTitle>
                    <DialogDescription>
                        <span className="text-sm text-muted-foreground">
                            {item.food.name}
                        </span>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label>Quantità con questa modifica</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className='cursor-pointer'
                                size="icon"
                                onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    setEditQuantity(Math.min(item.quantity, Math.max(1, value)));
                                }}
                                className="text-center w-20"
                                min="1"
                                max={item.quantity}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                className='cursor-pointer'
                                onClick={() => setEditQuantity(Math.min(item.quantity, editQuantity + 1))}
                                disabled={editQuantity >= item.quantity}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Indica quante unità devono avere questa personalizzazione (max: {item.quantity})
                        </p>
                    </div>

                    {/* Ingredients */}
                    {item.food.ingredients && item.food.ingredients.length > 0 && (
                        <div className="space-y-2">
                            <Label>Ingredienti</Label>
                            <div className="space-y-3 max-h-75 overflow-y-auto border rounded-md p-3">
                                {item.food.ingredients.map((ingredient) => {
                                    const qty = ingredientQuantities[ingredient.id] ?? 1;
                                    return (
                                        <div key={ingredient.id} className="flex items-center justify-between">
                                            <label className="text-sm font-medium">
                                                {ingredient.name}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 cursor-pointer"
                                                    onClick={() => updateIngredientQuantity(ingredient.id, -1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">{qty}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 cursor-pointer"
                                                    onClick={() => updateIngredientQuantity(ingredient.id, 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Imposta la quantità degli ingredienti (0 = nessuno)
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Nota</Label>
                        <Textarea
                            id="notes"
                            placeholder="Aggiungi una nota per questo prodotto..."
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        className='cursor-pointer'
                        onClick={onClose}
                    >
                        Annulla
                    </Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 cursor-pointer"
                        onClick={handleSave}
                    >
                        Salva
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
