import { ExtendedCartItem, Ingredient } from '@/lib/api-types';

/**
 * Calculate the total price of the cart including surcharges and discounts
 */
export function calculateTotal(cart: ExtendedCartItem[], discount: number = 0, allIngredients: Ingredient[] = []): number {
    const subtotal = cart.reduce((total, item) => {
        const price = typeof item.food.price === 'number'
            ? item.food.price
            : parseFloat(item.food.price as unknown as string);
        const itemTotal = price * item.quantity;
        const surcharge = calculateIngredientSurcharge(item, allIngredients);
        return total + itemTotal + surcharge;
    }, 0);

    return Math.max(0, subtotal - discount);
}

/**
 * Calculate total surcharges from all cart items
 */
export function calculateTotalSurcharges(cart: ExtendedCartItem[], allIngredients: Ingredient[] = []): number {
    return cart.reduce((total, item) => {
        return total + calculateIngredientSurcharge(item, allIngredients);
    }, 0);
}

/**
 * Calculate ingredient surcharge for a single cart item using per-ingredient surcharge rates
 */
export function calculateIngredientSurcharge(item: ExtendedCartItem, allIngredients: Ingredient[] = []): number {
    let surcharge = 0;

    // Surcharge for extra quantities of default ingredients
    if (item.ingredientQuantities && item.food.ingredients) {
        item.food.ingredients.forEach((ingredient) => {
            const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;
            if (qty > 1) {
                const rate = parseFloat(ingredient.surcharge ?? '0.5') || 0.5;
                surcharge += (qty - 1) * rate;
            }
        });
    }

    // Surcharge for added extra ingredients using per-ingredient rate
    if (item.extraIngredients) {
        for (const [id, qty] of Object.entries(item.extraIngredients)) {
            const ingredient = allIngredients.find((i) => i.id === id);
            const rate = parseFloat(ingredient?.surcharge ?? '0.5') || 0.5;
            surcharge += qty * rate;
        }
    }

    return surcharge * item.quantity;
}

/**
 * Calculate change from payment
 */
export function calculateChange(total: number, paidAmount: number): number {
    return paidAmount - total;
}

/**
 * Format price to string with 2 decimal places
 */
export function formatPrice(price: number | string): string {
    const numPrice = typeof price === 'number' ? price : parseFloat(price as string);
    return numPrice.toFixed(2);
}
