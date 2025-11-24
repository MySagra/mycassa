import { ExtendedCartItem } from '@/lib/api-types';

interface MergedOrderItem {
    foodId: string;
    quantity: number;
    notes?: string;
}

/**
 * Generate notes from ingredient modifications
 */
export function generateIngredientNotes(item: ExtendedCartItem): string {
    if (!item.ingredientQuantities || !item.food.ingredients) {
        return '';
    }

    const notes: string[] = [];

    item.food.ingredients.forEach((ingredient) => {
        const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;

        if (qty === 0) {
            // Ingredient removed
            notes.push(`No ${ingredient.name}`);
        } else if (qty > 1) {
            // Multiple ingredients
            notes.push(`${ingredient.name} x${qty}`);
        }
        // qty === 1 is standard, no note needed
    });

    return notes.join(', ');
}

/**
 * Merge cart items with same foodId and notes
 */
export function mergeCartItems(items: ExtendedCartItem[]): MergedOrderItem[] {
    const mergedMap = new Map<string, MergedOrderItem>();

    items.forEach((item) => {
        const ingredientNotes = generateIngredientNotes(item);
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

        // Create unique key: foodId + notes (or empty string if no notes)
        const key = `${item.food.id}|${finalNotes}`;

        if (mergedMap.has(key)) {
            // Merge quantities
            const existing = mergedMap.get(key)!;
            existing.quantity += item.quantity;
        } else {
            // Add new entry
            mergedMap.set(key, {
                foodId: item.food.id,
                quantity: item.quantity,
                ...(finalNotes && { notes: finalNotes }),
            });
        }
    });

    return Array.from(mergedMap.values());
}
