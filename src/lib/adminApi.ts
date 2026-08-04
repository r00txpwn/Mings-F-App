import { getAuthStorageKey } from './buildTarget';
import { resilientFetch } from './resilientFetch';
import { supabase } from './supabase';

export type AdminMutationOp = 'insert' | 'update' | 'delete' | 'upsert';

export interface AdminMutateRequest {
  table: string;
  operation: AdminMutationOp;
  payload?: Record<string, unknown>;
  match?: Record<string, unknown>;
  id?: string;
}

export interface AdminMutateResult<T = unknown> {
  ok: boolean;
  data?: T | null;
  error?: string;
  code?: string;
}

function readPersistedAccessToken(): string | null {
  try {
    const raw = localStorage.getItem(getAuthStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string; expires_at?: number };
    if (!parsed.access_token) return null;
    if (parsed.expires_at && parsed.expires_at < Math.floor(Date.now() / 1000)) return null;
    return parsed.access_token;
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string | null> {
  const persisted = readPersistedAccessToken();
  if (persisted) return persisted;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function invokeStaffEdgeFunction<T>(
  functionName: string,
  body: unknown,
  token: string
): Promise<AdminMutateResult<T>> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    return { ok: false, error: 'Supabase is not configured', code: 'CONFIG' };
  }

  let response: Response;
  try {
    response = await resilientFetch(`${baseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
      code: 'EDGE_ERROR',
    };
  }

  let parsed: { ok?: boolean; data?: T; error?: { message?: string; code?: string } };
  try {
    parsed = (await response.json()) as { ok?: boolean; data?: T; error?: { message?: string; code?: string } };
  } catch {
    return { ok: false, error: `HTTP ${response.status}`, code: 'EDGE_ERROR' };
  }

  if (!response.ok || !parsed.ok) {
    return {
      ok: false,
      error: parsed.error?.message ?? `HTTP ${response.status}`,
      code: parsed.error?.code ?? 'EDGE_ERROR',
    };
  }

  return { ok: true, data: parsed.data ?? null };
}

/**
 * Route staff cockpit mutations through the admin-api Edge Function (service role + audit log).
 */
export async function adminMutate<T = unknown>(req: AdminMutateRequest): Promise<AdminMutateResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Not signed in', code: 'UNAUTHORIZED' };
  }

  return invokeStaffEdgeFunction<T>('admin-api', req, token);
}

export async function adminInsert<T = unknown>(
  table: string,
  payload: Record<string, unknown>
): Promise<AdminMutateResult<T>> {
  return adminMutate<T>({ table, operation: 'insert', payload });
}

export async function adminUpdate<T = unknown>(
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<AdminMutateResult<T>> {
  return adminMutate<T>({ table, operation: 'update', id, payload });
}

export async function adminDelete<T = unknown>(
  table: string,
  id: string
): Promise<AdminMutateResult<T>> {
  return adminMutate<T>({ table, operation: 'delete', id });
}

export async function adminUpsert<T = unknown>(
  table: string,
  payload: Record<string, unknown>
): Promise<AdminMutateResult<T>> {
  return adminMutate<T>({ table, operation: 'upsert', payload });
}

export type PaymentRecheckResult = {
  ok?: boolean;
  outcome?: string;
  mapped?: string;
  providerStatus?: string;
  error?: string | { message?: string; code?: string };
  detail?: string;
  log_id?: string;
  result?: unknown;
};

/** Staff bridge → provider status re-check (admin/manager only; server-side). */
export async function recheckPayment(onlinePaymentId: string): Promise<AdminMutateResult<PaymentRecheckResult>> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Not signed in', code: 'UNAUTHORIZED' };
  }

  const { data, error } = await supabase.functions.invoke('admin-payment-recheck', {
    body: { online_payment_id: onlinePaymentId },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    let message = error.message;
    if (error && typeof error === 'object' && 'context' in error) {
      const ctx = (error as { context?: Response }).context;
      if (ctx instanceof Response) {
        try {
          const body = await ctx.clone().json();
          message = body?.error?.message ?? body?.error ?? message;
        } catch {
          // keep generic message
        }
      }
    }
    return { ok: false, error: message, code: 'EDGE_ERROR' };
  }

  const res = data as PaymentRecheckResult | null;
  if (res?.ok === false) {
    const err = res.error;
    return {
      ok: false,
      error: typeof err === 'object' && err != null ? err.message ?? 'Recheck failed' : String(err ?? 'Recheck failed'),
      code: typeof err === 'object' && err != null ? err.code : undefined,
    };
  }

  return { ok: true, data: res ?? null };
}
