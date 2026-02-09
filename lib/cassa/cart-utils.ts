import { ExtendedCartItem } from '@/lib/api-types';
import { calculateIngredientSurcharge } from '@/lib/cassa/calculations';

interface MergedOrderItem {
    foodId: string;
    quantity: number;
    notes?: string;
    surcharge: number;
}

/**
 * Generate notes from ingredient modifications
 */
export function generateIngredientNotes(item: ExtendedCartItem, allIngredients?: { id: string; name: string }[]): string {
    const notes: string[] = [];

    // Notes for default ingredient modifications
    if (item.ingredientQuantities && item.food.ingredients) {
        item.food.ingredients.forEach((ingredient) => {
            const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;
            if (qty === 0) {
                notes.push(`No ${ingredient.name}`);
            } else if (qty > 1) {
                notes.push(`${ingredient.name} x${qty}`);
            }
        });
    }

    // Notes for extra ingredients
    if (item.extraIngredients) {
        for (const [id, qty] of Object.entries(item.extraIngredients)) {
            // Try to find name from allIngredients, or from food ingredients
            const ingredient = allIngredients?.find((i) => i.id === id);
            const name = ingredient?.name ?? id;
            if (qty === 1) {
                notes.push(`+${name}`);
            } else {
                notes.push(`+${qty} ${name}`);
            }
        }
    }

    return notes.join(', ');
}

/**
 * Merge cart items with same foodId and notes
 */
export function mergeCartItems(items: ExtendedCartItem[], allIngredients?: { id: string; name: string }[]): MergedOrderItem[] {
    const mergedMap = new Map<string, MergedOrderItem>();

    items.forEach((item) => {
        const ingredientNotes = generateIngredientNotes(item, allIngredients);
        const customNotes = item.notes || '';

        // Concatenate custom notes with ingredient notes
        let finalNotes = '';
        if (customNotes && ingredientNotes) {
            finalNotes = `${customNotes}, ${ingredientNotes}`;
        } else if (customNotes) {
            finalNotes = customNotes;
        } else if (ingredientNotes) {
            finalNotes = ingredientNotes;
        }

        // Calculate surcharge for this item
        const itemSurcharge = calculateIngredientSurcharge(item);

        // Create unique key: foodId + notes (or empty string if no notes)
        const key = `${item.food.id}|${finalNotes}`;

        if (mergedMap.has(key)) {
            // Merge quantities and surcharges
            const existing = mergedMap.get(key)!;
            existing.quantity += item.quantity;
            existing.surcharge += itemSurcharge;
        } else {
            // Add new entry
            mergedMap.set(key, {
                foodId: item.food.id,
                quantity: item.quantity,
                ...(finalNotes && { notes: finalNotes }),
                surcharge: itemSurcharge,
            });
        }
    });

    return Array.from(mergedMap.values());
}
