import { describe, expect, it } from 'vitest';
import {
  canToggleSalesChannelActive,
  dedupeSalesChannelsForDisplay,
  isDeletableSalesChannel,
  isProtectedSalesChannel,
  isProtectedSalesChannelName,
  SYSTEM_SALES_CHANNEL_IDS,
} from '../../src/lib/salesChannelPolicy';

describe('isProtectedSalesChannelName', () => {
  it('protects required system and partner channels', () => {
    expect(isProtectedSalesChannelName('Wolt')).toBe(true);
    expect(isProtectedSalesChannelName('Bolt')).toBe(true);
    expect(isProtectedSalesChannelName('Bolt Food')).toBe(true);
    expect(isProtectedSalesChannelName('Kiosk')).toBe(true);
    expect(isProtectedSalesChannelName('Online')).toBe(true);
    expect(isProtectedSalesChannelName('POS')).toBe(true);
    expect(isProtectedSalesChannelName('pos')).toBe(true);
  });

  it('allows optional and custom channels', () => {
    expect(isProtectedSalesChannelName('ChoiceQR')).toBe(false);
    expect(isProtectedSalesChannelName('Choice QR')).toBe(false);
    expect(isProtectedSalesChannelName('Custom Partner')).toBe(false);
  });
});

describe('isProtectedSalesChannel', () => {
  it('protects canonical ids even when name was edited', () => {
    const kioskId = [...SYSTEM_SALES_CHANNEL_IDS].find((id) => id.startsWith('27571'))!;
    expect(isProtectedSalesChannel({ id: kioskId, name: 'Renamed channel' })).toBe(true);
  });
});

describe('dedupeSalesChannelsForDisplay', () => {
  it('shows one POS row when legacy duplicate exists', () => {
    const channels = dedupeSalesChannelsForDisplay([
      { id: 'legacy-pos-id', name: 'POS' },
      { id: '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c', name: 'POS' },
    ]);
    expect(channels).toHaveLength(1);
    expect(channels[0]?.id).toBe('7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c');
  });
});

describe('channel mutability helpers', () => {
  it('marks protected channels as non-deletable and non-toggleable', () => {
    const protectedChannel = { id: '27571bbe-fadb-48e2-be17-bf71f46ac9e3', name: 'Online' };
    expect(isDeletableSalesChannel(protectedChannel)).toBe(false);
    expect(canToggleSalesChannelActive(protectedChannel)).toBe(false);
  });

  it('allows ChoiceQR to be deleted and toggled', () => {
    const optional = { id: 'c84b69dd-c3de-4fd6-a8a5-e1c7390d2ae3', name: 'ChoiceQR' };
    expect(isDeletableSalesChannel(optional)).toBe(true);
    expect(canToggleSalesChannelActive(optional)).toBe(true);
  });
});
