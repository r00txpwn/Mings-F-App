import type { SalesChannel } from './supabase';
import { normalizeSalesChannelName } from './salesChannelPolicy';

/** Partner platforms allowed for manual Add Sale (kiosk / online are app-generated). */
export function isPartnerManualSaleChannelName(name: string): boolean {
  const normalized = normalizeSalesChannelName(name);
  if (!normalized) return false;

  if (normalized === 'wolt' || normalized.startsWith('wolt ')) return true;
  if (normalized === 'bolt' || normalized.startsWith('bolt ')) return true;
  if (normalized === 'choiceqr' || normalized === 'choice qr' || normalized.startsWith('choice qr')) {
    return true;
  }

  return false;
}

export function isPartnerManualSaleChannel(channel: Pick<SalesChannel, 'name'>): boolean {
  return isPartnerManualSaleChannelName(channel.name);
}
