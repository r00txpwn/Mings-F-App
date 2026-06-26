/** Mirror of src/lib/salesChannelPolicy.ts for Edge Functions. Keep in sync. */

export const SYSTEM_SALES_CHANNEL_IDS = new Set([
  '59e8f2ea-dd1b-4096-808a-f0026b3cc643',
  '27571bbe-fadb-48e2-be17-bf71f46ac9e3',
  '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc',
  'f91273ac-b4b8-402a-bbb3-d356d64a4459',
  '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c',
]);

export const CANONICAL_POS_SALES_CHANNEL_ID = '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c';

export function normalizeSalesChannelName(name: string): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isProtectedSalesChannelName(name: string): boolean {
  const normalized = normalizeSalesChannelName(name);
  if (!normalized) return false;

  if (normalized === 'kiosk' || normalized === 'online' || normalized === 'pos') return true;
  if (normalized === 'wolt' || normalized.startsWith('wolt ')) return true;
  if (normalized === 'bolt' || normalized === 'bolt food' || normalized.startsWith('bolt ')) return true;

  return false;
}

export function isProtectedSalesChannel(channel: { id?: string | null; name?: string | null }): boolean {
  if (channel.id && SYSTEM_SALES_CHANNEL_IDS.has(channel.id)) return true;
  return isProtectedSalesChannelName(channel.name ?? '');
}

const PROTECTED_MUTATION_MESSAGE = 'This sales channel is required by the system and cannot be changed or removed.';

export function assertSalesChannelMutationAllowed(
  operation: 'insert' | 'update' | 'delete' | 'upsert',
  existing: { id?: string | null; name?: string | null } | null | undefined,
  payload?: Record<string, unknown> | null
): { ok: true } | { ok: false; message: string } {
  if (operation === 'insert' || operation === 'upsert') {
    const insertName = typeof payload?.name === 'string' ? payload.name : '';
    const insertId = typeof payload?.id === 'string' ? payload.id : null;
    if (isProtectedSalesChannel({ id: insertId, name: insertName })) {
      return { ok: false, message: PROTECTED_MUTATION_MESSAGE };
    }
    return { ok: true };
  }

  if (operation === 'delete') {
    if (existing && isProtectedSalesChannel(existing)) {
      return { ok: false, message: PROTECTED_MUTATION_MESSAGE };
    }
    return { ok: true };
  }

  if (operation === 'update' && existing && isProtectedSalesChannel(existing)) {
    if (payload?.is_deleted === true) {
      return { ok: false, message: PROTECTED_MUTATION_MESSAGE };
    }
    if (payload?.is_active === false) {
      return { ok: false, message: PROTECTED_MUTATION_MESSAGE };
    }
    if (typeof payload?.name === 'string' && normalizeSalesChannelName(payload.name) !== normalizeSalesChannelName(existing.name ?? '')) {
      return { ok: false, message: PROTECTED_MUTATION_MESSAGE };
    }
  }

  return { ok: true };
}
