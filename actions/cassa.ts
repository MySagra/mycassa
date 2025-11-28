'use server';

import { auth, signOut } from '@/lib/auth';
import { get } from 'http';

function isRedirectError(error: any) {
  return error && (
    error.digest?.startsWith('NEXT_REDIRECT') ||
    error.message === 'NEXT_REDIRECT'
  );
}

/**
 * Get categories available for current user
 */
/**
 * Get categories available for current user
 */
export async function getCategories() {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/categories?available=true&include=foods`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      return { success: false, error: 'Errore nel caricamento delle categorie' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getCategories error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Get a single food by ID
 */
export async function getFoodById(foodId: string) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  if (!foodId || typeof foodId !== 'string') {
    return { success: false, error: 'ID cibo non valido' };
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/foods/${foodId}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      return { success: false, error: 'Errore nel caricamento del cibo' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getFoodById error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Get today's orders
 */
export async function getTodayOrders() {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
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

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Impossibile caricare gli ordini di oggi' };
    }

    const orders = (await response.json()).data;
    return { success: true, data: orders };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getTodayOrders error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Get order by display code
 */
export async function getOrderByCode(code: string) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  if (!code || typeof code !== 'string') {
    return { success: false, error: 'Codice ordine non valido' };
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

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Impossibile caricare l\'ordine' };
    }

    const data = await response.json();
    const order = data.data[0];

    // Check if order exists
    if (!order) {
      return { success: false, error: 'L\'ordine non esiste' };
    }

    const orderDetailResult = await getOrderByOrderId(order.id);
    if (!orderDetailResult.success) {
      return orderDetailResult;
    }
    return { success: true, data: orderDetailResult.data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getOrderByCode error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getOrderByOrderId(orderId: number) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  if (!orderId || typeof orderId !== 'number') {
    return { success: false, error: 'ID ordine non valido' };
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Impossibile caricare l\'ordine' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getOrderByOrderId error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Search orders by value (tavolo, cliente, o id)
 */
export async function searchDailyOrders(searchValue: string) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  if (!searchValue || typeof searchValue !== 'string') {
    return { success: false, error: 'Valore di ricerca non valido' };
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

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Errore nella ricerca degli ordini' };
    }

    const data = (await response.json()).data;
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('searchDailyOrders error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
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
    userId: string;
    cashRegisterId: string;
    discount: number;
    surcharge: number;
  };
}) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
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

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Impossibile creare l\'ordine' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('createOrder error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Confirm existing order
 */
export async function confirmOrder(orderData: {
  orderId: number;
  paymentMethod: string;
  userId: string;
  cashRegisterId: string;
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
    return { success: false, error: 'Non autenticato' };
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

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || 'Impossibile confermare l\'ordine' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('confirmOrder error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}

/**
 * Get cash registers
 */
export async function getCashRegisters() {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const response = await fetch(`${process.env.API_URL}/v1/cash-registers`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      await signOut({ redirectTo: '/login' });
    }

    if (!response.ok) {
      return { success: false, error: 'Errore nel caricamento delle casse' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getCashRegisters error:', error);
    return { success: false, error: error.message || 'Errore sconosciuto' };
  }
}
