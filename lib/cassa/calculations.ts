import { ExtendedCartItem } from '@/lib/api-types';

/**
 * Calculate the total price of the cart including surcharges and discounts
 */
export function calculateTotal(cart: ExtendedCartItem[], discount: number = 0): number {
    const subtotal = cart.reduce((total, item) => {
        const price = typeof item.food.price === 'number'
            ? item.food.price
            : parseFloat(item.food.price as unknown as string);
        const itemTotal = price * item.quantity;
        const surcharge = calculateIngredientSurcharge(item);
        return total + itemTotal + surcharge;
    }, 0);

    // Apply discount (fixed amount)
    return Math.max(0, subtotal - discount);
}

/**
 * Calculate total surcharges from all cart items
 */
export function calculateTotalSurcharges(cart: ExtendedCartItem[]): number {
    return cart.reduce((total, item) => {
        return total + calculateIngredientSurcharge(item);
    }, 0);
}

/**
 * Calculate ingredient surcharge for a single cart item
 * Extra ingredients cost 0.5€ each
 */
export function calculateIngredientSurcharge(item: ExtendedCartItem): number {
    if (!item.ingredientQuantities || !item.food.ingredients) {
        return 0;
    }

    let surcharge = 0;

    item.food.ingredients.forEach((ingredient) => {
        const qty = item.ingredientQuantities?.[ingredient.id] ?? 1;

        if (qty > 1) {
            // Add 0.5 for each extra piece
            surcharge += (qty - 1) * 0.5;
        }
    });

    return surcharge * item.quantity; // Multiply by item quantity
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
