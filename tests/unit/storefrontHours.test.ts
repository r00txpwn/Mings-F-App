import { describe, expect, it } from 'vitest';
import { bakuWallToUtcDate, type KitchenSettings } from '../../src/lib/kitchenAcceptance';
import { storefrontHoursStrip } from '../../src/order/storefrontHours';
import { formatStorefrontAzn, formatStorefrontAznDelta } from '../../src/order/storefrontMoney';

const hoursMon10to2230: Record<string, unknown> = {
  sun: { closed: true, open: '10:00', close: '22:30' },
  mon: { closed: false, open: '10:00', close: '22:30' },
  tue: { closed: false, open: '10:00', close: '22:30' },
  wed: { closed: false, open: '10:00', close: '22:30' },
  thu: { closed: false, open: '10:00', close: '22:30' },
  fri: { closed: false, open: '10:00', close: '22:30' },
  sat: { closed: false, open: '10:00', close: '22:30' },
};

function settings(over: Partial<KitchenSettings> = {}): KitchenSettings {
  return {
    is_open: true,
    hours_json: hoursMon10to2230,
    offline_until: null,
    closing_soon_minutes: 0,
    ...over,
  };
}

describe('storefrontHoursStrip', () => {
  it('shows open + until close while inside hours', () => {
    const when = bakuWallToUtcDate(2026, 9, 14, 12, 0, 0);
    const strip = storefrontHoursStrip(settings(), when);
    expect(strip.open).toBe(true);
    expect(strip.status).toBe('OPEN');
    expect(strip.untilHm).toBe('22:30');
  });

  it('marks paused when kitchen is closed by staff', () => {
    const when = bakuWallToUtcDate(2026, 9, 14, 12, 0, 0);
    const strip = storefrontHoursStrip(settings({ is_open: false }), when);
    expect(strip.open).toBe(false);
    expect(strip.status).toBe('PAUSED');
  });
});

describe('formatStorefrontAzn', () => {
  it('uses the wireframe AZN suffix', () => {
    expect(formatStorefrontAzn(8)).toBe('8.00 AZN');
    expect(formatStorefrontAznDelta(0.5)).toBe('+0.50 AZN');
    expect(formatStorefrontAznDelta(0)).toBe('');
  });
});
