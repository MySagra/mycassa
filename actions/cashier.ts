'use server';

import { getAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { redirect } from 'next/navigation';

function isRedirectError(error: any) {
  return error && (
    error.digest?.startsWith('NEXT_REDIRECT') ||
    error.message === 'NEXT_REDIRECT'
  );
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }
  return {
    'Content-Type': 'application/json',
    'Cookie': `${AUTH_COOKIE_NAME}=${token}`,
  };
}

function getDailyOrderDateRange() {
  const now = new Date();
  const CUTOFF_HOUR_UTC = 8;

  const baseDate = new Date(now);
  if (now.getUTCHours() < CUTOFF_HOUR_UTC) {
    baseDate.setUTCDate(baseDate.getUTCDate() - 1);
  }

  const nextDate = new Date(baseDate);
  nextDate.setUTCDate(baseDate.getUTCDate() + 1);

  const dateFrom = `${baseDate.toISOString().split('T')[0]}T07%3A59%3A00Z`;
  const dateTo = `${nextDate.toISOString().split('T')[0]}T08%3A00%3A00Z`;

  return { dateFrom, dateTo };
}

function errBody(errorData: any, fallback: string) {
  return {
    error: errorData.message || fallback,
    code: errorData.type ?? errorData.code as string | undefined,
  };
}

export async function getStations() {
  try {
    const headers = await authHeaders();

    const [categoriesRes, stationsRes] = await Promise.all([
      fetch(`${process.env.API_URL}/v1/categories?include=foods.ingredients&foodsAvailable=all`, {
        headers,
        cache: 'no-store',
      }),
      fetch(`${process.env.API_URL}/v1/stations`, {
        headers,
        cache: 'no-store',
      }),
    ]);

    if (!categoriesRes.ok || !stationsRes.ok) {
      const failedRes = !categoriesRes.ok ? categoriesRes : stationsRes;
      const errorData = await failedRes.json().catch(() => ({}));
      return { success: false as const, status: failedRes.status, ...errBody(errorData, 'Errore nel caricamento delle stazioni') };
    }

    const categories = await categoriesRes.json();
    const stations = await stationsRes.json();

    return { success: true as const, data: { categories, stations } };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getStations error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

/** @deprecated Use getStations instead */
export async function getCategories() {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/categories?include=foods.ingredients`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento delle categorie') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getCategories error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getFoodById(foodId: string) {
  if (!foodId || typeof foodId !== 'string') {
    return { success: false as const, status: 400, error: 'ID cibo non valido' };
  }

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/foods/${foodId}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento del cibo') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getFoodById error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getTodayOrders() {
  try {
    const headers = await authHeaders();
    const { dateFrom, dateTo } = getDailyOrderDateRange();

    const response = await fetch(`${process.env.API_URL}/v1/orders?page=1&limit=20&sortBy=createdAt&status=PENDING&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile caricare gli ordini di oggi') };
    }

    const orders = (await response.json()).data;
    return { success: true as const, data: orders };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getTodayOrders error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getAllTodayOrders() {
  try {
    const headers = await authHeaders();
    const { dateFrom, dateTo } = getDailyOrderDateRange();

    const response = await fetch(`${process.env.API_URL}/v1/orders?page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile caricare tutti gli ordini di oggi') };
    }

    const orders = (await response.json()).data;
    return { success: true as const, data: orders };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getAllTodayOrders error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getOrderByCode(code: string) {
  if (!code || typeof code !== 'string') {
    return { success: false as const, status: 400, error: 'Codice ordine non valido' };
  }

  const { dateFrom, dateTo } = getDailyOrderDateRange();

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders?displayCode=${encodeURIComponent(code)}&page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile caricare l\'ordine') };
    }

    const data = await response.json();
    const order = data.data[0];

    if (!order) {
      return { success: false as const, status: 404, error: 'L\'ordine non esiste' };
    }

    const orderDetailResult = await getOrderByOrderId(order.id);
    if (!orderDetailResult.success) {
      return orderDetailResult;
    }
    return { success: true as const, data: orderDetailResult.data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getOrderByCode error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getOrderByOrderId(orderId: string) {
  if (!orderId || typeof orderId !== 'string') {
    return { success: false as const, status: 400, error: 'ID ordine non valido' };
  }

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile caricare l\'ordine') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getOrderByOrderId error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function searchDailyOrders(searchValue: string) {
  if (!searchValue || typeof searchValue !== 'string') {
    return { success: false as const, status: 400, error: 'Valore di ricerca non valido' };
  }

  const { dateFrom, dateTo } = getDailyOrderDateRange();

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders?search=${searchValue}&page=1&limit=20&sortBy=createdAt&status=PENDING&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nella ricerca degli ordini') };
    }

    const data = (await response.json()).data;
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('searchDailyOrders error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function searchAllDailyOrders(searchValue: string) {
  if (!searchValue || typeof searchValue !== 'string') {
    return { success: false as const, status: 400, error: 'Valore di ricerca non valido' };
  }

  const { dateFrom, dateTo } = getDailyOrderDateRange();

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders?search=${searchValue}&page=1&limit=20&sortBy=createdAt&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nella ricerca di tutti gli ordini') };
    }

    const data = (await response.json()).data;
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('searchAllDailyOrders error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

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
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile creare l\'ordine') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('createOrder error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function confirmOrder(orderData: {
  orderId: string;
  paymentMethod: string;
  userId: string;
  cashRegisterId: string;
  discount: number;
  customer?: string;
  table?: string;
  orderItems: Array<{
    foodId: string;
    quantity: number;
    notes?: string;
    surcharge: number;
  }>;
}) {
  try {
    const headers = await authHeaders();
    const { orderId, ...bodyData } = orderData;

    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile confermare l\'ordine') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('confirmOrder error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getCashRegisters() {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/cash-registers?enabled=true`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento delle casse') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getCashRegisters error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getUsers() {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/users`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento degli utenti') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getUsers error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getAllIngredients() {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/ingredients`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento degli ingredienti') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getAllIngredients error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function getPrinterById(printerId: string) {
  if (!printerId || typeof printerId !== 'string') {
    return { success: false as const, status: 400, error: 'ID stampante non valido' };
  }

  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/printers/${printerId}`, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Errore nel caricamento della stampante') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('getPrinterById error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function generalClosure(cashRegisterId: string) {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/reports/general-closure`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ cashRegister: cashRegisterId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile eseguire la chiusura cashier') };
    }

    const data = await response.json().catch(() => ({}));
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('generalClosure error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile annullare l\'ordine') };
    }

    return { success: true as const };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('cancelOrder error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function reprintOrder(orderId: string, body: {
  orderItems: string[];
  reprintReceipt: boolean;
}) {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/orders/${orderId}/reprint`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile eseguire la ristampa') };
    }

    const data = await response.json();
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('reprintOrder error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}

export async function openDrawer(cashRegisterId: string) {
  try {
    const headers = await authHeaders();
    const response = await fetch(`${process.env.API_URL}/v1/cash-registers/${cashRegisterId}/open-drawer`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false as const, status: response.status, ...errBody(errorData, 'Impossibile aprire il cassetto') };
    }

    const data = await response.json().catch(() => ({}));
    return { success: true as const, data };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('openDrawer error:', error);
    return { success: false as const, status: 0, error: error.message || 'Errore sconosciuto' };
  }
}
