'use server';

import { auth } from '@/lib/auth';

/**
 * Get categories available for current user
 */
export async function getCategories() {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/categories/available`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Errore nel caricamento delle categorie');
    }

    return await response.json();
  } catch (error) {
    console.error('getCategories error:', error);
    throw error;
  }
}

/**
 * Get foods available for current user
 */
export async function getFoods() {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/foods/available?include=ingredients`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Errore nel caricamento dei cibi');
    }

    return await response.json();
  } catch (error) {
    console.error('getFoods error:', error);
    throw error;
  }
}

/**
 * Get today's orders
 */
export async function getTodayOrders() {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders/day/today`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Impossibile caricare gli ordini di oggi');
    }

    return await response.json();
  } catch (error) {
    console.error('getTodayOrders error:', error);
    throw error;
  }
}

/**
 * Get order by display code
 */
export async function getOrderByCode(displayCode: string) {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders/${displayCode.toUpperCase()}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Impossibile caricare l\'ordine');
    }

    return await response.json();
  } catch (error) {
    console.error('getOrderByCode error:', error);
    throw error;
  }
}

/**
 * Create a new order
 */
export async function createOrder(orderData: {
  table: number;
  customer: string;
  orderItems: Array<{
    foodId: string;
    quantity: number;
    notes?: string;
  }>;
}) {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Impossibile creare l\'ordine');
    }

    return await response.json();
  } catch (error) {
    console.error('createOrder error:', error);
    throw error;
  }
}

/**
 * Confirm order
 */
export async function confirmOrder(orderData: {
  orderId: number;
  paymentMethod: string;
  discount?: number;
  surcharge?: number;
  orderItems: Array<{
    foodId: string;
    quantity: number;
    notes?: string;
  }>;
}) {
  const session = await auth();
  
  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/confirmed-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Impossibile confermare l\'ordine');
    }

    return await response.json();
  } catch (error) {
    console.error('confirmOrder error:', error);
    throw error;
  }
}
