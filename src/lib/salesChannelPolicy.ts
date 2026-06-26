import type { SalesChannel } from './supabase';

/** Canonical ids from migrations — one row per required system channel. */
export const SYSTEM_SALES_CHANNEL_IDS = new Set([
  '59e8f2ea-dd1b-4096-808a-f0026b3cc643', // Online
  '27571bbe-fadb-48e2-be17-bf71f46ac9e3', // Kiosk
  '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc', // Wolt
  'f91273ac-b4b8-402a-bbb3-d356d64a4459', // Bolt
  '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c', // POS
]);

export const CANONICAL_POS_SALES_CHANNEL_ID = '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c';

/** Normalize channel name for policy checks (trim, lowercase, collapse spaces). */
export function normalizeSalesChannelName(name: string): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Required system channels — must not be deleted or deactivated in Settings.
 * Wolt, Bolt, Kiosk, Online, POS.
 */
export function isProtectedSalesChannelName(name: string): boolean {
  const normalized = normalizeSalesChannelName(name);
  if (!normalized) return false;

  if (normalized === 'kiosk' || normalized === 'online' || normalized === 'pos') return true;
  if (normalized === 'wolt' || normalized.startsWith('wolt ')) return true;
  if (normalized === 'bolt' || normalized === 'bolt food' || normalized.startsWith('bolt ')) return true;

  return false;
}

export function isProtectedSalesChannel(channel: Pick<SalesChannel, 'id' | 'name'>): boolean {
  if (channel.id && SYSTEM_SALES_CHANNEL_IDS.has(channel.id)) return true;
  return isProtectedSalesChannelName(channel.name);
}

export function isDeletableSalesChannel(channel: Pick<SalesChannel, 'id' | 'name'>): boolean {
  return !isProtectedSalesChannel(channel);
}

export function canToggleSalesChannelActive(channel: Pick<SalesChannel, 'id' | 'name'>): boolean {
  return isDeletableSalesChannel(channel);
}

/** Prefer canonical system row when legacy migrations left duplicate names (e.g. two POS rows). */
export function dedupeSalesChannelsForDisplay<T extends Pick<SalesChannel, 'id' | 'name'>>(
  channels: T[],
): T[] {
  const byName = new Map<string, T>();

  for (const channel of channels) {
    const key = normalizeSalesChannelName(channel.name);
    if (!key) continue;

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, channel);
      continue;
    }

    const keepExisting =
      SYSTEM_SALES_CHANNEL_IDS.has(existing.id) && !SYSTEM_SALES_CHANNEL_IDS.has(channel.id);
    if (!keepExisting) {
      byName.set(key, channel);
    }
  }

  return [...byName.values()];
}
