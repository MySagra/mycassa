import { useState, useEffect } from 'react';
import { ExtendedCartItem, Ingredient } from '@/lib/api-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Search } from 'lucide-react';

interface EditItemDialogProps {
    item: ExtendedCartItem | null;
    open: boolean;
    onClose: () => void;
    onSave: (quantity: number, notes: string, ingredientQuantities: Record<string, number>, extraIngredients: Record<string, number>) => void;
    allIngredients?: Ingredient[];
}

export function EditItemDialog({ item, open, onClose, onSave, allIngredients = [] }: EditItemDialogProps) {
    const [editQuantity, setEditQuantity] = useState(1);
    const [editNotes, setEditNotes] = useState('');
    const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, number>>({});
    const [extraIngredients, setExtraIngredients] = useState<Record<string, number>>({});
    const [extraSearch, setExtraSearch] = useState('');

    // Compute available extra ingredients (all ingredients minus those already in the food)
    const foodIngredientIds = new Set(item?.food.ingredients?.map((i) => i.id) ?? []);
    const availableExtras = allIngredients.filter((i) => !foodIngredientIds.has(i.id));

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
            setExtraIngredients(item.extraIngredients ? { ...item.extraIngredients } : {});
            setExtraSearch('');
        }
    }, [item]);

    const updateIngredientQuantity = (ingredientId: string, delta: number) => {
        setIngredientQuantities((prev) => {
            const currentQty = prev[ingredientId] ?? 1;
            const newQty = Math.max(0, currentQty + delta);
            return { ...prev, [ingredientId]: newQty };
        });
    };

    const updateExtraIngredientQuantity = (ingredientId: string, delta: number) => {
        setExtraIngredients((prev) => {
            const currentQty = prev[ingredientId] ?? 1;
            const newQty = Math.max(1, currentQty + delta);
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

    const handleSave = () => {
        onSave(editQuantity, editNotes, ingredientQuantities, extraIngredients);
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[425px] overflow-hidden">
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
                    {(item.food.ingredients && item.food.ingredients.length > 0 || Object.keys(extraIngredients).length > 0) && (
                        <div className="space-y-2">
                            <Label>Ingredienti</Label>
                            <div className="space-y-3 max-h-65 overflow-y-auto border rounded-md p-3">
                                {/* Default food ingredients */}
                                {item.food.ingredients?.map((ingredient) => {
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

                                {/* Separator + extra ingredient rows */}
                                {Object.keys(extraIngredients).length > 0 && item.food.ingredients && item.food.ingredients.length > 0 && (
                                    <div className="border-t my-2" />
                                )}
                                {Object.entries(extraIngredients).map(([id, qty]) => {
                                    const ingredient = allIngredients.find((i) => i.id === id);
                                    if (!ingredient) return null;
                                    return (
                                        <div key={id} className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-amber-500">
                                                {ingredient.name}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 cursor-pointer"
                                                    onClick={() => updateExtraIngredientQuantity(id, -1)}
                                                    disabled={qty <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">{qty}</span>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 cursor-pointer"
                                                    onClick={() => updateExtraIngredientQuantity(id, 1)}
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

                    {/* Extra Ingredients Accordion */}
                    {availableExtras.length > 0 && item.food.ingredients && item.food.ingredients.length > 0 && (
                        <Accordion type="single" collapsible className="border rounded-md p-3">
                            <AccordionItem value="extra-ingredients" className="border-b-0">
                                <AccordionTrigger className="py-2 items-center focus-visible:ring-0 focus-visible:border-transparent">
                                    <Label className="cursor-pointer shrink-0">Aggiungi Ingredienti</Label>
                                    <div
                                        className="relative flex-1 min-w-0 hidden [[data-state=open]>&]:block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            placeholder="Cerca..."
                                            value={extraSearch}
                                            onChange={(e) => setExtraSearch(e.target.value)}
                                            className="pl-8 h-7 text-xs"
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {availableExtras
                                            .filter((i) => i.name.toLowerCase().includes(extraSearch.toLowerCase()))
                                            .map((ingredient) => {
                                                const isSelected = extraIngredients[ingredient.id] !== undefined;
                                                return (
                                                    <Badge
                                                        key={ingredient.id}
                                                        variant={isSelected ? 'default' : 'outline'}
                                                        className="cursor-pointer select-none"
                                                        onClick={() => toggleExtraIngredient(ingredient.id)}
                                                    >
                                                        {ingredient.name}
                                                    </Badge>
                                                );
                                            })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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
