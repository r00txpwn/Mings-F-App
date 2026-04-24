import { describe, expect, it } from 'vitest';
import {
  acceptingKitchen,
  bakuWallToUtcDate,
  getKitchenStatus,
  getSessionEndBaku,
  nextOpenBoundary,
  scheduleSlots,
  type KitchenSettings,
} from '../../src/lib/kitchenAcceptance';

const hoursMon10to22: Record<string, unknown> = {
  sun: { closed: true, open: '10:00', close: '22:00' },
  mon: { closed: false, open: '10:00', close: '22:00' },
  tue: { closed: false, open: '10:00', close: '22:00' },
  wed: { closed: false, open: '10:00', close: '22:00' },
  thu: { closed: false, open: '10:00', close: '22:00' },
  fri: { closed: false, open: '10:00', close: '22:00' },
  sat: { closed: false, open: '10:00', close: '22:00' },
};

function baseSettings(over: Partial<KitchenSettings> = {}): KitchenSettings {
  return {
    is_open: true,
    hours_json: hoursMon10to22,
    offline_until: null,
    closing_soon_minutes: 0,
    ...over,
  };
}

describe('kitchenAcceptance', () => {
  it('treats missing hours_json as open when not paused', () => {
    const s = baseSettings({ hours_json: {} });
    const when = bakuWallToUtcDate(2026, 6, 15, 12, 0, 0);
    expect(getKitchenStatus(s, when).status).toBe('OPEN');
  });

  it('PAUSED when is_open false and no offline_until', () => {
    const s = baseSettings({ is_open: false, offline_until: null });
    const when = bakuWallToUtcDate(2026, 6, 15, 12, 0, 0);
    expect(getKitchenStatus(s, when).status).toBe('PAUSED');
    expect(acceptingKitchen(s, when, 'immediate')).toBe(false);
  });

  it('PAUSED when before offline_until', () => {
    const s = baseSettings({
      is_open: false,
      offline_until: '2026-06-15T12:30:00.000Z',
    });
    const when = new Date('2026-06-15T12:00:00.000Z');
    expect(getKitchenStatus(s, when).status).toBe('PAUSED');
  });

  it('immediate orders stay PAUSED when is_open false even after offline_until (until row is reopened)', () => {
    const s = baseSettings({
      is_open: false,
      offline_until: '2026-06-15T06:00:00.000Z',
    });
    const when = bakuWallToUtcDate(2026, 6, 15, 12, 0, 0);
    expect(getKitchenStatus(s, when, { orderMode: 'immediate' }).status).toBe('PAUSED');
    expect(acceptingKitchen(s, when, 'immediate')).toBe(false);
  });

  it('scheduled inside hours after offline_until is OPEN while is_open still false', () => {
    const s = baseSettings({
      is_open: false,
      offline_until: '2026-06-15T06:00:00.000Z',
    });
    const when = bakuWallToUtcDate(2026, 6, 15, 12, 0, 0);
    expect(getKitchenStatus(s, when, { orderMode: 'scheduled' }).status).toBe('OPEN');
    expect(acceptingKitchen(s, when, 'scheduled')).toBe(true);
  });

  it('CLOSED outside configured hours', () => {
    const s = baseSettings();
    const when = bakuWallToUtcDate(2026, 6, 15, 8, 0, 0);
    expect(getKitchenStatus(s, when).status).toBe('CLOSED');
    expect(acceptingKitchen(s, when, 'immediate')).toBe(false);
  });

  it('CLOSING_SOON when within threshold before close', () => {
    const s = baseSettings({ closing_soon_minutes: 15 });
    const when = bakuWallToUtcDate(2026, 6, 15, 21, 50, 0);
    expect(getKitchenStatus(s, when, { orderMode: 'immediate' }).status).toBe('CLOSING_SOON');
    expect(acceptingKitchen(s, when, 'immediate')).toBe(true);
  });

  it('scheduled mode never returns CLOSING_SOON', () => {
    const s = baseSettings({ closing_soon_minutes: 15 });
    const when = bakuWallToUtcDate(2026, 6, 15, 21, 50, 0);
    expect(getKitchenStatus(s, when, { orderMode: 'scheduled' }).status).toBe('OPEN');
  });

  it('closing_soon_minutes 0 disables soft close', () => {
    const s = baseSettings({ closing_soon_minutes: 0 });
    const when = bakuWallToUtcDate(2026, 6, 15, 21, 50, 0);
    expect(getKitchenStatus(s, when).status).toBe('OPEN');
  });

  it('getSessionEndBaku returns same-day close for normal window', () => {
    const end = getSessionEndBaku(bakuWallToUtcDate(2026, 6, 15, 12, 0, 0), hoursMon10to22);
    expect(end).not.toBeNull();
    const p = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baku',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(end!);
    expect(p).toMatch(/22:00/);
  });

  it('scheduleSlots skips PAUSED times before offline_until', () => {
    const s = baseSettings({
      is_open: false,
      offline_until: '2026-06-15T14:00:00.000Z',
      hours_json: hoursMon10to22,
    });
    const now = new Date('2026-06-15T11:00:00.000Z');
    const slots = scheduleSlots(s, now, { slotMinutes: 15, leadMinutes: 30, maxSlots: 50 });
    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0]!;
    expect(first.getTime()).toBeGreaterThanOrEqual(new Date('2026-06-15T14:00:00.000Z').getTime());
  });

  it('nextOpenBoundary returns a future instant after hours end', () => {
    const s = baseSettings();
    const now = bakuWallToUtcDate(2026, 6, 15, 22, 30, 0);
    const next = nextOpenBoundary(s, now);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(now.getTime());
  });
});
