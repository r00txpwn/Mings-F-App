import { describe, expect, it } from 'vitest';
import { isPartnerManualSaleChannelName } from '../../src/lib/partnerSalesChannels';

describe('isPartnerManualSaleChannelName', () => {
  it('matches canonical partner names', () => {
    expect(isPartnerManualSaleChannelName('Wolt')).toBe(true);
    expect(isPartnerManualSaleChannelName('Bolt')).toBe(true);
    expect(isPartnerManualSaleChannelName('Bolt Food')).toBe(true);
    expect(isPartnerManualSaleChannelName('ChoiceQR')).toBe(true);
    expect(isPartnerManualSaleChannelName('Choice QR')).toBe(true);
  });

  it('rejects app-generated channels', () => {
    expect(isPartnerManualSaleChannelName('Kiosk')).toBe(false);
    expect(isPartnerManualSaleChannelName('Online')).toBe(false);
    expect(isPartnerManualSaleChannelName('In-Store')).toBe(false);
  });
});
