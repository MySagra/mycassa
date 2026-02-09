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
 * Calcola il range di date per il "giorno lavorativo" degli ordini.
 * Il giorno lavorativo va dalle 08:00 UTC alle 08:00 UTC del giorno successivo.
 * Se l'ora corrente è prima delle 08:00 UTC (es. mezzanotte-8), il turno
 * è ancora quello iniziato alle 08:00 del giorno precedente.
 */
function getDailyOrderDateRange() {
  const now = new Date();
  const CUTOFF_HOUR_UTC = 8;

  // Determina la data base del turno
  const baseDate = new Date(now);
  if (now.getUTCHours() < CUTOFF_HOUR_UTC) {
    // Prima delle 8 UTC: il turno è iniziato ieri alle 8
    baseDate.setUTCDate(baseDate.getUTCDate() - 1);
  }

  const nextDate = new Date(baseDate);
  nextDate.setUTCDate(baseDate.getUTCDate() + 1);

  const dateFrom = `${baseDate.toISOString().split('T')[0]}T07%3A59%3A00Z`;
  const dateTo = `${nextDate.toISOString().split('T')[0]}T08%3A00%3A00Z`;

  return { dateFrom, dateTo };
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
    const { dateFrom, dateTo } = getDailyOrderDateRange();

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
 * Get all today's orders (regardless of status)
 */
export async function getAllTodayOrders() {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  try {
    const { dateFrom, dateTo } = getDailyOrderDateRange();

    const response = await fetch(`${process.env.API_URL}/v1/orders?page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
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
      return { success: false, error: errorData.message || 'Impossibile caricare tutti gli ordini di oggi' };
    }

    const orders = (await response.json()).data;
    return { success: true, data: orders };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('getAllTodayOrders error:', error);
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

  const { dateFrom, dateTo } = getDailyOrderDateRange();

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

  const { dateFrom, dateTo } = getDailyOrderDateRange();

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
 * Search all orders by value (tavolo, cliente, o id) - regardless of status
 */
export async function searchAllDailyOrders(searchValue: string) {
  const session = await auth();

  if (!session?.accessToken) {
    return { success: false, error: 'Non autenticato' };
  }

  if (!searchValue || typeof searchValue !== 'string') {
    return { success: false, error: 'Valore di ricerca non valido' };
  }

  const { dateFrom, dateTo } = getDailyOrderDateRange();

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
      return { success: false, error: errorData.message || 'Errore nella ricerca di tutti gli ordini' };
    }

    const data = (await response.json()).data;
    return { success: true, data };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('searchAllDailyOrders error:', error);
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
    surcharge: number;
  }>;
  confirm?: {
    paymentMethod: string;
    userId: string;
    cashRegisterId: string;
    discount: number;
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
  orderItems: Array<{
    foodId: string;
    quantity: number;
    notes?: string;
    surcharge: number;
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
