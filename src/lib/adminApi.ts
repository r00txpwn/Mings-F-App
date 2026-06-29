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

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Route staff cockpit mutations through the admin-api Edge Function (service role + audit log).
 */
export async function adminMutate<T = unknown>(req: AdminMutateRequest): Promise<AdminMutateResult<T>> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Not signed in', code: 'UNAUTHORIZED' };
  }

  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: req,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    let message = error.message;
    if (error && typeof error === 'object' && 'context' in error) {
      const ctx = (error as { context?: Response }).context;
      if (ctx instanceof Response) {
        try {
          const body = await ctx.clone().json();
          message = body?.error?.message ?? message;
        } catch {
          // keep generic message
        }
      }
    }
    return { ok: false, error: message, code: 'EDGE_ERROR' };
  }

  const res = data as { ok?: boolean; data?: T; error?: { message?: string; code?: string } } | null;
  if (!res?.ok) {
    return {
      ok: false,
      error: res?.error?.message ?? 'Mutation failed',
      code: res?.error?.code,
    };
  }

  return { ok: true, data: res.data ?? null };
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
