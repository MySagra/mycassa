'use server';

import { getAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import type { ActionResult } from '@/lib/api-error';

/** Recupera tutte le impostazioni centralizzate dal backend (`GET /v1/settings`). */
export async function getSettings(): Promise<ActionResult<unknown>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, status: 401, error: 'Non autenticato' };
    }

    const response = await fetch(`${process.env.API_URL}/v1/settings`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `${AUTH_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        status: response.status,
        error: errorData.message || 'Errore nel caricamento delle impostazioni',
        code: errorData.type ?? errorData.code ?? errorData.error,
      };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error('getSettings error:', error);
    return { success: false, status: 0, error: error instanceof Error ? error.message : 'Errore sconosciuto' };
  }
}
