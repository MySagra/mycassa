/**
 * Format date to Italian locale string
 */
export function formatDate(date: string): string {
    return new Date(date).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format price to string with 2 decimal places and € symbol
 */
export function formatPriceWithSymbol(price: number | string): string {
    const numPrice = typeof price === 'number' ? price : parseFloat(price as string);
    return `${numPrice.toFixed(2)} €`;
}
