import { z } from 'zod';

// Validation schemas
export const orderSchema = z.object({
    customer: z.string().min(2, 'Il nome del cliente deve contenere almeno 2 caratteri'),
    table: z.string().min(1, 'Il numero del tavolo è obbligatorio'),
});

export const paidAmountSchema = z.string()
    .regex(/^[0-9]+([.,][0-9]{0,2})?$/, 'Importo non valido (solo numeri, max 2 decimali)')
    .transform((val) => parseFloat(val.replace(',', '.')))
    .refine((val) => val >= 0, 'L\'importo deve essere maggiore o uguale a 0')
    .refine((val) => val <= 9999.99, 'L\'importo massimo è 9999.99');

export const discountAmountSchema = z.string()
    .regex(/^[0-9]+([.,][0-9]{0,2})?$/, 'Importo sconto non valido (solo numeri, max 2 decimali)')
    .transform((val) => parseFloat(val.replace(',', '.')))
    .refine((val) => val >= 0, 'Lo sconto deve essere maggiore o uguale a 0')
    .refine((val) => val <= 9999.99, 'L\'importo massimo è 9999.99');

/**
 * Get validation messages for order button
 * Returns an array of error messages, or null if no errors
 */
export function getOrderValidationMessage(
    cartLength: number,
    customer: string,
    table: string,
    enableTableInput: boolean
): string[] | null {
    const errors: string[] = [];

    if (cartLength === 0) {
        errors.push('Il carrello è vuoto');
    }

    if (!customer.trim()) {
        errors.push('Inserisci il nome del cliente');
    } else {
        const result = orderSchema.shape.customer.safeParse(customer);
        if (!result.success) {
            errors.push(result.error.issues[0].message);
        }
    }

    if (enableTableInput && !table.trim()) {
        errors.push('Inserisci il numero del tavolo');
    }

    if (errors.length === 0) return null;

    return errors;
}
