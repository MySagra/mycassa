/**
 * Errore applicativo che rappresenta una risposta non ok da un'API.
 *
 * Le Server Action restituiscono un risultato strutturato (`{ success, status, code, error }`)
 * perché Next.js redige gli errori sollevati che attraversano il confine server→client.
 * Lato client il risultato viene riconvertito in un `ApiError`, così il chiamante può
 * usare `instanceof ApiError` e gestire i casi di autenticazione in modo centralizzato.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message?: string, code?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** 401/403: sessione assente, scaduta o permessi insufficienti. */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

/** Risultato standard di una Server Action che incapsula esiti d'errore API. */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; status: number; code?: string; error: string };

/**
 * Converte un `ActionResult` in dato grezzo, sollevando `ApiError` in caso di fallimento.
 * Da usare lato client nel try/catch del chiamante.
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.success) {
    throw new ApiError(result.status, result.error, result.code);
  }
  return result.data;
}
