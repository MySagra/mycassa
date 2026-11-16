import { z } from 'zod';
import { OrderFieldsConfig, validateCustomer, validateTable } from './order-fields';

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
    fields: OrderFieldsConfig
): string[] | null {
    const errors: string[] = [];

    if (cartLength === 0) {
        errors.push('Il carrello è vuoto');
    }

    const customerError = validateCustomer(customer, fields);
    if (customerError) errors.push(customerError);

    const tableError = validateTable(table, fields);
    if (tableError) errors.push(tableError);

    if (errors.length === 0) return null;

    return errors;
}
