'use server';

import { auth } from '@/lib/auth';
import { get } from 'http';

/**
 * Get categories available for current user
 */
/**
 * Get categories available for current user
 */
export async function getCategories() {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/categories?available=true&include=foods`, {
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
 * Get a single food by ID
 */
export async function getFoodById(foodId: string) {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  if (!foodId || typeof foodId !== 'string') {
    throw new Error('ID cibo non valido');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/foods/${foodId}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Errore nel caricamento del cibo');
    }

    return await response.json();
  } catch (error) {
    console.error('getFoodById error:', error);
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateFrom = `${today.toISOString().split('T')[0]}T07%3A59%3A00Z`;
    const dateTo = `${tomorrow.toISOString().split('T')[0]}T08%3A00%3A00Z`;

    const response = await fetch(`${process.env.API_URL}/v1/orders?page=1&limit=20&sortBy=createdAt&status=PENDING&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
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

    const orders = (await response.json()).data;
    return orders;
  } catch (error) {
    console.error('getTodayOrders error:', error);
    throw error;
  }
}

/**
 * Get order by display code
 */
export async function getOrderByCode(code: string) {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  if (!code || typeof code !== 'string') {
    throw new Error('Codice ordine non valido');
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dateFrom = `${today.toISOString().split('T')[0]}T07%3A59%3A00Z`;
  const dateTo = `${tomorrow.toISOString().split('T')[0]}T08%3A00%3A00Z`;

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders?displayCode=${encodeURIComponent(code)}&page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
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

    const order = (await response.json()).data[0];

    return await getOrderByOrderId(order.id);
  } catch (error) {
    console.error('getOrderByCode error:', error);
    throw error;
  }
}

export async function getOrderByOrderId(orderId: number) {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  if (!orderId || typeof orderId !== 'number') {
    throw new Error('ID ordine non valido');
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}`, {
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
 * Search orders by value (tavolo, cliente, o id)
 */
export async function searchDailyOrders(searchValue: string) {
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error('Non autenticato');
  }

  if (!searchValue || typeof searchValue !== 'string') {
    throw new Error('Valore di ricerca non valido');
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dateFrom = `${today.toISOString().split('T')[0]}T07%3A59%3A00Z`;
  const dateTo = `${tomorrow.toISOString().split('T')[0]}T08%3A00%3A00Z`;

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders?search=${searchValue}&page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Errore nella ricerca degli ordini');
    }

    return (await response.json()).data;
  } catch (error) {
    console.error('searchDailyOrders error:', error);
    throw error;
  }
}

/**
 * Create a new order
 */
/**
 * Create a new order (optionally confirmed)
 */
export async function createOrder(orderData: {
  table: string;
  customer: string;
  orderItems: Array<{
    foodId: string;
    quantity: number;
    notes?: string;
  }>;
  confirm?: {
    paymentMethod: string;
    discount: number;
    surcharge: number;
  };
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
 * Confirm existing order
 */
export async function confirmOrder(orderData: {
  orderId: number;
  paymentMethod: string;
  discount: number;
  surcharge: number;
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
    // Extract orderId and prepare body without it
    const { orderId, ...bodyData } = orderData;

    // Use orderId in URL path: /v1/orders/:id/confirm
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
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
