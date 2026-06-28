/**
 * Kitchen acceptance rules for online orders (Asia/Baku wall clock).
 * MUST stay in sync with `src/lib/kitchenAcceptance.ts` (duplicate for Edge runtime).
 */

export type KitchenAcceptanceStatus = 'OPEN' | 'CLOSING_SOON' | 'PAUSED' | 'CLOSED';

export type KitchenOrderMode = 'immediate' | 'scheduled';

/** Subset of `online_settings` row used by acceptance logic. */
export interface KitchenSettings {
  is_open?: boolean | null;
  hours_json: Record<string, unknown> | unknown;
  offline_until?: string | null;
  closing_soon_minutes?: number | null;
  special_days_json?: unknown;
}

/** One-off Baku calendar date overriding weekly hours_json. */
export interface KitchenSpecialDay {
  date: string;
  closed: boolean;
  open?: string;
  close?: string;
  note_en?: string;
  note_az?: string;
  note_ru?: string;
}

const BAKU_TZ = 'Asia/Baku';

const SCHEDULE_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type ScheduleDayKey = (typeof SCHEDULE_DAY_KEYS)[number];

export interface DayHoursConfig {
  closed: boolean;
  openMinutes: number;
  closeMinutes: number;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function getScheduleDayKeyFromBakuParts(dow0Sun6Sat: number): ScheduleDayKey {
  return SCHEDULE_DAY_KEYS[dow0Sun6Sat] ?? 'mon';
}

export function getDayHoursConfig(
  hoursJson: Record<string, unknown> | undefined,
  dayKey: ScheduleDayKey,
): DayHoursConfig | null {
  if (!hoursJson || typeof hoursJson !== 'object') return null;
  const raw = hoursJson[dayKey];
  if (!raw || typeof raw !== 'object') return null;
  const dayObj = raw as Record<string, unknown>;
  const openRaw = typeof dayObj.open === 'string' ? dayObj.open : null;
  const closeRaw = typeof dayObj.close === 'string' ? dayObj.close : null;
  const openMinutes = openRaw ? parseTimeToMinutes(openRaw) : null;
  const closeMinutes = closeRaw ? parseTimeToMinutes(closeRaw) : null;
  if (openMinutes == null || closeMinutes == null) return null;
  return {
    closed: Boolean(dayObj.closed),
    openMinutes,
    closeMinutes,
  };
}

/** Baku calendar date key `YYYY-MM-DD` for instant `when`. */
export function getBakuDateKey(when: Date): string {
  const { y, mon, d } = getBakuWallParts(when);
  return `${y}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseSpecialDaysJson(raw: unknown): KitchenSpecialDay[] {
  if (!Array.isArray(raw)) return [];
  const out: KitchenSpecialDay[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) continue;
    out.push({
      date: o.date,
      closed: Boolean(o.closed),
      open: typeof o.open === 'string' ? o.open : undefined,
      close: typeof o.close === 'string' ? o.close : undefined,
      note_en: typeof o.note_en === 'string' ? o.note_en : undefined,
      note_az: typeof o.note_az === 'string' ? o.note_az : undefined,
      note_ru: typeof o.note_ru === 'string' ? o.note_ru : undefined,
    });
  }
  return out;
}

export function getSpecialDayForBakuDate(settings: KitchenSettings, when: Date): KitchenSpecialDay | null {
  const key = getBakuDateKey(when);
  return parseSpecialDaysJson(settings.special_days_json).find((d) => d.date === key) ?? null;
}

function specialDayToDayHoursConfig(special: KitchenSpecialDay): DayHoursConfig | null {
  if (special.closed) {
    return { closed: true, openMinutes: 0, closeMinutes: 0 };
  }
  const openMinutes = special.open ? parseTimeToMinutes(special.open) : null;
  const closeMinutes = special.close ? parseTimeToMinutes(special.close) : null;
  if (openMinutes == null || closeMinutes == null) return null;
  return { closed: false, openMinutes, closeMinutes };
}

/** Weekly hours or special-day override for the Baku calendar date of `when`. */
export function getEffectiveDayConfig(settings: KitchenSettings, when: Date): DayHoursConfig | null {
  const special = getSpecialDayForBakuDate(settings, when);
  if (special) return specialDayToDayHoursConfig(special);
  const hoursJson = settings.hours_json as Record<string, unknown> | undefined;
  const parts = getBakuWallParts(when);
  const dayKey = getScheduleDayKeyFromBakuParts(parts.dow0Sun6Sat);
  return getDayHoursConfig(hoursJson, dayKey);
}

/** Customer note for a special day in the given language (fallback to any filled note). */
export function getSpecialDayCustomerNote(
  special: KitchenSpecialDay,
  lang: 'en' | 'az' | 'ru',
): string | null {
  const byLang = { en: special.note_en, az: special.note_az, ru: special.note_ru };
  const primary = byLang[lang]?.trim();
  if (primary) return primary;
  for (const key of ['en', 'az', 'ru'] as const) {
    const v = byLang[key]?.trim();
    if (v) return v;
  }
  return null;
}

/** Baku-local calendar + clock parts for instant `when` (UTC instant). */
export function getBakuWallParts(when: Date): {
  y: number;
  mon: number;
  d: number;
  hour: number;
  minute: number;
  second: number;
  dow0Sun6Sat: number;
  minutesSinceMidnight: number;
} {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: BAKU_TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  });
  const parts = dtf.formatToParts(when);
  const pick = (type: Intl.DateTimeFormatPartTypes) => {
    const raw = parts.find((p) => p.type === type)?.value ?? '0';
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };
  const y = pick('year');
  const mon = pick('month');
  const d = pick('day');
  const hour = pick('hour');
  const minute = pick('minute');
  const second = pick('second');
  const wdRaw = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const wd = wdRaw.replace(/\.$/, '').slice(0, 3);
  const dowMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dow0Sun6Sat = dowMap[wd] ?? 1;
  return {
    y,
    mon,
    d,
    hour,
    minute,
    second,
    dow0Sun6Sat,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/** Convert Baku wall time to UTC `Date` (Azerbaijan Standard Time = UTC+4). */
export function bakuWallToUtcDate(y: number, mon: number, d: number, h: number, min: number, sec = 0): Date {
  return new Date(Date.UTC(y, mon - 1, d, h - 4, min, sec, 0));
}

export function isSlotInsideWorkingHoursBaku(
  minutesSinceMidnight: number,
  config: DayHoursConfig | null,
): boolean {
  if (!config) return true;
  if (config.closed) return false;
  const { openMinutes, closeMinutes } = config;
  if (openMinutes === closeMinutes) return true;
  if (openMinutes < closeMinutes) {
    return minutesSinceMidnight >= openMinutes && minutesSinceMidnight < closeMinutes;
  }
  return minutesSinceMidnight >= openMinutes || minutesSinceMidnight < closeMinutes;
}

function isInsideHours(settings: KitchenSettings, when: Date): boolean {
  const cfg = getEffectiveDayConfig(settings, when);
  const parts = getBakuWallParts(when);
  return isSlotInsideWorkingHoursBaku(parts.minutesSinceMidnight, cfg);
}

function parseOfflineUntil(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isKitchenPaused(settings: KitchenSettings, when: Date): boolean {
  if (settings.is_open !== false) return false;
  const ou = parseOfflineUntil(settings.offline_until ?? null);
  if (!ou) return true;
  return when.getTime() < ou.getTime();
}

/** End of the current open session in Baku (first instant where we are outside hours), or null. */
export function getSessionEndBaku(settings: KitchenSettings, when: Date): Date | null {
  const parts = getBakuWallParts(when);
  const cfg = getEffectiveDayConfig(settings, when);
  if (!cfg || cfg.closed) return null;
  if (!isSlotInsideWorkingHoursBaku(parts.minutesSinceMidnight, cfg)) return null;

  const { openMinutes, closeMinutes } = cfg;
  const { y, mon, d } = parts;

  if (openMinutes < closeMinutes) {
    const ch = Math.floor(closeMinutes / 60);
    const cm = closeMinutes % 60;
    return bakuWallToUtcDate(y, mon, d, ch, cm, 0);
  }

  if (parts.minutesSinceMidnight >= openMinutes) {
    const ch = Math.floor(closeMinutes / 60);
    const cm = closeMinutes % 60;
    const base = Date.UTC(y, mon - 1, d, 0, 0, 0, 0);
    const nextDay = new Date(base + 24 * 60 * 60 * 1000);
    const nd = getBakuWallParts(nextDay);
    return bakuWallToUtcDate(nd.y, nd.mon, nd.d, ch, cm, 0);
  }

  const ch = Math.floor(closeMinutes / 60);
  const cm = closeMinutes % 60;
  return bakuWallToUtcDate(y, mon, d, ch, cm, 0);
}

/** Minutes until current session ends; null if not inside hours or cannot compute. */
export function minutesUntilSessionEnd(settings: KitchenSettings, when: Date): number | null {
  const end = getSessionEndBaku(settings, when);
  if (!end) return null;
  const diffMs = end.getTime() - when.getTime();
  const mins = diffMs / 60_000;
  if (!(mins > 0)) return null;
  return mins;
}

export interface GetKitchenStatusOptions {
  orderMode?: KitchenOrderMode;
}

export interface KitchenStatusResult {
  status: KitchenAcceptanceStatus;
  nextOpenAt?: Date;
  minutesToClose?: number;
}

export function getKitchenStatus(
  settings: KitchenSettings,
  when: Date,
  options: GetKitchenStatusOptions = {},
): KitchenStatusResult {
  const orderMode = options.orderMode ?? 'immediate';

  if (orderMode === 'immediate') {
    if (settings.is_open === false) {
      return { status: 'PAUSED' };
    }
  } else if (isKitchenPaused(settings, when)) {
    return { status: 'PAUSED' };
  }

  const inside = isInsideHours(settings, when);
  if (!inside) {
    const next = nextOpenBoundary(settings, when);
    return { status: 'CLOSED', nextOpenAt: next ?? undefined };
  }

  const threshold = Math.max(0, Math.floor(Number(settings.closing_soon_minutes ?? 0)));
  if (orderMode === 'immediate' && threshold > 0) {
    const m = minutesUntilSessionEnd(settings, when);
    if (m != null && m > 0 && m <= threshold) {
      return { status: 'CLOSING_SOON', minutesToClose: m };
    }
  }

  return { status: 'OPEN' };
}

export function acceptingKitchen(
  settings: KitchenSettings,
  when: Date,
  orderMode: KitchenOrderMode = 'immediate',
): boolean {
  const { status } = getKitchenStatus(settings, when, { orderMode });
  if (status === 'OPEN') return true;
  if (status === 'CLOSING_SOON' && orderMode === 'immediate') return true;
  return false;
}

function bakuCalendarMidnight(y: number, mon: number, d: number): Date {
  return bakuWallToUtcDate(y, mon, d, 0, 0, 0);
}

function addBakuCalendarDays(y: number, mon: number, d: number, deltaDays: number): { y: number; mon: number; d: number } {
  const base = bakuCalendarMidnight(y, mon, d);
  const next = new Date(base.getTime() + deltaDays * 86400000);
  const p = getBakuWallParts(next);
  return { y: p.y, mon: p.mon, d: p.d };
}

export function firstOpenInstantAfter(
  settings: KitchenSettings,
  after: Date,
  horizonDays = 14,
): Date | null {
  const startParts = getBakuWallParts(after);

  for (let dOff = 0; dOff < horizonDays; dOff += 1) {
    const { y, mon, d } = addBakuCalendarDays(startParts.y, startParts.mon, startParts.d, dOff);
    const noon = bakuWallToUtcDate(y, mon, d, 12, 0, 0);
    const cfg = getEffectiveDayConfig(settings, noon);
    if (!cfg || cfg.closed) continue;

    const oh = Math.floor(cfg.openMinutes / 60);
    const om = cfg.openMinutes % 60;
    const openInstant = bakuWallToUtcDate(y, mon, d, oh, om, 0);
    if (openInstant.getTime() <= after.getTime()) continue;

    const probe = new Date(openInstant.getTime() + 60_000);
    if (isInsideHours(settings, probe)) return openInstant;
  }
  return null;
}

export function nextOpenBoundary(settings: KitchenSettings, now: Date): Date | null {
  if (isInsideHours(settings, now)) {
    const end = getSessionEndBaku(settings, now);
    if (end) return firstOpenInstantAfter(settings, end);
  }
  return firstOpenInstantAfter(settings, now);
}

export interface ScheduleSlotsOptions {
  slotMinutes: number;
  leadMinutes: number;
  maxSlots?: number;
}

export function scheduleSlots(settings: KitchenSettings, now: Date, opts: ScheduleSlotsOptions): Date[] {
  const slotMinutes = Math.max(5, Math.floor(opts.slotMinutes));
  const lead = Math.max(0, Math.floor(opts.leadMinutes));
  const maxSlots = opts.maxSlots ?? 240;
  const slotMs = slotMinutes * 60_000;

  const earliest = new Date(now.getTime() + lead * 60_000);
  earliest.setSeconds(0, 0);
  const roundedTs = Math.ceil(earliest.getTime() / slotMs) * slotMs;
  const horizonTs = roundedTs + 7 * 24 * 60 * 60_000;
  const slots: Date[] = [];

  for (let ts = roundedTs; ts <= horizonTs && slots.length < maxSlots; ts += slotMs) {
    const slotDate = new Date(ts);
    if (slotDate.getTime() < earliest.getTime()) continue;
    const parts = getBakuWallParts(slotDate);
    const dayConfig = getEffectiveDayConfig(settings, slotDate);
    if (!isSlotInsideWorkingHoursBaku(parts.minutesSinceMidnight, dayConfig)) continue;
    if (!acceptingKitchen(settings, slotDate, 'scheduled')) continue;
    slots.push(slotDate);
  }
  return slots;
}
