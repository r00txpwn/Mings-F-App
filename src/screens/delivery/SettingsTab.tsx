import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import type { OnlineSettingsRow, SpecialDay } from '../../types/online';
import {
  getBakuDateKey,
  getEffectiveDayConfig,
  getKitchenStatus,
  getSpecialDayForBakuDate,
  type KitchenSettings,
} from '../../lib/kitchenAcceptance';

export interface SettingsTabTranslations {
  title: string;
  description: string;
  kitchenOpen: string;
  kitchenOpenHint: string;
  deliveryEnabled: string;
  takeawayEnabled: string;
  globalMinOrder: string;
  defaultPrep: string;
  defaultPrepHint: string;
  globalFreeThreshold: string;
  kitchenLocationTitle: string;
  kitchenLocationHint: string;
  kitchenLatitude: string;
  kitchenLongitude: string;
  kitchenLocationInvalid: string;
  dispatchMode: string;
  dispatchAuto: string;
  dispatchManual: string;
  hours: string;
  hoursHint: string;
  closed: string;
  open: string;
  close: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  closingSoonMinutesLabel: string;
  closingSoonMinutesHint: string;
  pauseActive: string;
  cancelPause: string;
  hoursInvalid: string;
  days: { mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string };
  statusOpenNow: string;
  statusClosedNow: string;
  statusPaused: string;
  todayHours: string;
  todayClosed: string;
  specialDayBadge: string;
  acceptingOrders: string;
  stoppedOrders: string;
  acceptingOrdersHint: string;
  stoppedOrdersHint: string;
  dayOpen: string;
  weeklyHours: string;
  specialDaysTitle: string;
  specialDaysHint: string;
  specialDayAdd: string;
  specialDayRemove: string;
  specialDayDate: string;
  specialDayClosedAllDay: string;
  specialDayCustomHours: string;
  specialDayNote: string;
  specialDayNoteHint: string;
  specialDayNoteEn: string;
  specialDayNoteAz: string;
  specialDayNoteRu: string;
  specialDayDuplicateDate: string;
  specialDaysInvalid: string;
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = (typeof DAY_KEYS)[number];

interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

type HoursState = Record<DayKey, DayHours>;

const DEFAULT_DAY: DayHours = { closed: false, open: '10:00', close: '23:00' };

function readHoursJson(raw: Record<string, unknown> | undefined | null): HoursState {
  const out: HoursState = {
    mon: { ...DEFAULT_DAY },
    tue: { ...DEFAULT_DAY },
    wed: { ...DEFAULT_DAY },
    thu: { ...DEFAULT_DAY },
    fri: { ...DEFAULT_DAY },
    sat: { ...DEFAULT_DAY },
    sun: { ...DEFAULT_DAY },
  };
  if (!raw || typeof raw !== 'object') return out;
  for (const key of DAY_KEYS) {
    const day = (raw as Record<string, unknown>)[key];
    if (day && typeof day === 'object') {
      const obj = day as Record<string, unknown>;
      out[key] = {
        closed: Boolean(obj.closed),
        open: typeof obj.open === 'string' ? obj.open : DEFAULT_DAY.open,
        close: typeof obj.close === 'string' ? obj.close : DEFAULT_DAY.close,
      };
    }
  }
  return out;
}

function serialiseHoursJson(hours: HoursState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of DAY_KEYS) out[key] = hours[key];
  return out;
}

function readSpecialDays(raw: unknown): SpecialDay[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is SpecialDay => {
      if (!item || typeof item !== 'object') return false;
      const o = item as SpecialDay;
      return typeof o.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.date);
    })
    .map((item) => ({
      date: item.date,
      closed: Boolean(item.closed),
      open: item.open ?? '10:00',
      close: item.close ?? '23:00',
      note_en: item.note_en ?? '',
      note_az: item.note_az ?? '',
      note_ru: item.note_ru ?? '',
    }));
}

function formatEffectiveHours(cfg: ReturnType<typeof getEffectiveDayConfig>): string | null {
  if (!cfg || cfg.closed) return null;
  const oh = String(Math.floor(cfg.openMinutes / 60)).padStart(2, '0');
  const om = String(cfg.openMinutes % 60).padStart(2, '0');
  const ch = String(Math.floor(cfg.closeMinutes / 60)).padStart(2, '0');
  const cm = String(cfg.closeMinutes % 60).padStart(2, '0');
  return `${oh}:${om}–${ch}:${cm}`;
}

interface SettingsTabProps {
  settings: OnlineSettingsRow | null;
  loading: boolean;
  updateSettings: (patch: Partial<OnlineSettingsRow>) => Promise<{ error: { message: string } | null }>;
  t: SettingsTabTranslations;
  onError: (message: string) => void;
  onSaved: (message: string) => void;
}

export function SettingsTab({ settings, loading, updateSettings, t, onError, onSaved }: SettingsTabProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [minOrder, setMinOrder] = useState('0');
  const [defaultPrep, setDefaultPrep] = useState('25');
  const [freeThreshold, setFreeThreshold] = useState('');
  const [kitchenLat, setKitchenLat] = useState('');
  const [kitchenLng, setKitchenLng] = useState('');
  const [dispatchMode, setDispatchMode] = useState<'auto' | 'manual'>('auto');
  const [hours, setHours] = useState<HoursState>(() => readHoursJson(null));
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [closingSoonMinutes, setClosingSoonMinutes] = useState('0');
  const [saving, setSaving] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!settings) return;
    setIsOpen(settings.is_open !== false);
    setDeliveryEnabled(Boolean(settings.delivery_enabled));
    setTakeawayEnabled(Boolean(settings.takeaway_enabled));
    setMinOrder(String(settings.min_order_amount ?? 0));
    setDefaultPrep(String(settings.default_prep_time_minutes ?? 25));
    setFreeThreshold(settings.free_delivery_threshold != null ? String(settings.free_delivery_threshold) : '');
    setKitchenLat(settings.kitchen_lat != null ? String(settings.kitchen_lat) : '');
    setKitchenLng(settings.kitchen_lng != null ? String(settings.kitchen_lng) : '');
    setDispatchMode(settings.dispatch_mode === 'manual' ? 'manual' : 'auto');
    setHours(readHoursJson(settings.hours_json as Record<string, unknown>));
    setSpecialDays(readSpecialDays(settings.special_days_json));
    setClosingSoonMinutes(String(settings.closing_soon_minutes ?? 0));
  }, [settings]);

  const draftKitchenSettings = useMemo((): KitchenSettings => {
    return {
      is_open: isOpen,
      hours_json: serialiseHoursJson(hours),
      offline_until: settings?.offline_until ?? null,
      closing_soon_minutes: Number(closingSoonMinutes) || 0,
      special_days_json: specialDays,
    };
  }, [closingSoonMinutes, hours, isOpen, settings?.offline_until, specialDays]);

  void tick;
  const now = useMemo(() => new Date(), [tick]);

  const liveStatus = useMemo(
    () => getKitchenStatus(draftKitchenSettings, now, { orderMode: 'immediate' }),
    [draftKitchenSettings, now],
  );

  const todaySpecial = useMemo(
    () => getSpecialDayForBakuDate(draftKitchenSettings, now),
    [draftKitchenSettings, now],
  );

  const todayEffective = useMemo(
    () => getEffectiveDayConfig(draftKitchenSettings, now),
    [draftKitchenSettings, now],
  );

  const todayHoursLine = useMemo(() => {
    const formatted = formatEffectiveHours(todayEffective);
    if (formatted) return t.todayHours.replace('{hours}', formatted);
    return t.todayClosed;
  }, [t.todayClosed, t.todayHours, todayEffective]);

  const statusHeadline = useMemo(() => {
    if (liveStatus.status === 'PAUSED') return t.statusPaused;
    if (liveStatus.status === 'OPEN' || liveStatus.status === 'CLOSING_SOON') return t.statusOpenNow;
    return t.statusClosedNow;
  }, [liveStatus.status, t.statusClosedNow, t.statusOpenNow, t.statusPaused]);

  const dayLabel = useMemo<Record<DayKey, string>>(
    () => ({
      mon: t.days.mon,
      tue: t.days.tue,
      wed: t.days.wed,
      thu: t.days.thu,
      fri: t.days.fri,
      sat: t.days.sat,
      sun: t.days.sun,
    }),
    [t.days],
  );

  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const handleSave = async () => {
    const lat = kitchenLat.trim() === '' ? null : Number(kitchenLat);
    const lng = kitchenLng.trim() === '' ? null : Number(kitchenLng);
    const latValid = lat == null || (Number.isFinite(lat) && lat >= -90 && lat <= 90);
    const lngValid = lng == null || (Number.isFinite(lng) && lng >= -180 && lng <= 180);
    if (!latValid || !lngValid) {
      onError(t.kitchenLocationInvalid);
      return;
    }
    for (const key of DAY_KEYS) {
      const day = hours[key];
      if (day.closed) continue;
      if (!timeRe.test(day.open.trim()) || !timeRe.test(day.close.trim())) {
        onError(t.hoursInvalid);
        return;
      }
    }
    const dates = specialDays.map((d) => d.date);
    if (new Set(dates).size !== dates.length) {
      onError(t.specialDayDuplicateDate);
      return;
    }
    for (const sd of specialDays) {
      if (!sd.date) {
        onError(t.specialDaysInvalid);
        return;
      }
      if (!sd.closed && (!timeRe.test(sd.open?.trim() ?? '') || !timeRe.test(sd.close?.trim() ?? ''))) {
        onError(t.specialDaysInvalid);
        return;
      }
    }
    setSaving(true);
    const cleanedSpecialDays = specialDays.map((sd) => ({
      date: sd.date,
      closed: sd.closed,
      open: sd.closed ? undefined : sd.open,
      close: sd.closed ? undefined : sd.close,
      note_en: sd.note_en?.trim() || undefined,
      note_az: sd.note_az?.trim() || undefined,
      note_ru: sd.note_ru?.trim() || undefined,
    }));
    const { error } = await updateSettings({
      is_open: isOpen,
      delivery_enabled: deliveryEnabled,
      takeaway_enabled: takeawayEnabled,
      min_order_amount: Number(minOrder) || 0,
      default_prep_time_minutes: Number(defaultPrep) || 25,
      free_delivery_threshold: freeThreshold.trim() === '' ? null : Number(freeThreshold) || 0,
      kitchen_lat: lat,
      kitchen_lng: lng,
      dispatch_mode: dispatchMode,
      hours_json: serialiseHoursJson(hours),
      special_days_json: cleanedSpecialDays,
      closing_soon_minutes: Math.max(0, Math.min(240, Math.floor(Number(closingSoonMinutes) || 0))),
    });
    setSaving(false);
    if (error) onError(`${t.saveError}: ${error.message}`);
    else onSaved(t.saved);
  };

  const updateDay = (key: DayKey, patch: Partial<DayHours>) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const addSpecialDay = () => {
    setSpecialDays((prev) => [
      ...prev,
      {
        date: getBakuDateKey(new Date()),
        closed: true,
        open: '10:00',
        close: '23:00',
        note_en: '',
        note_az: '',
        note_ru: '',
      },
    ]);
  };

  const updateSpecialDay = (index: number, patch: Partial<SpecialDay>) => {
    setSpecialDays((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeSpecialDay = (index: number) => {
    setSpecialDays((prev) => prev.filter((_, i) => i !== index));
  };

  const statusCardClass =
    liveStatus.status === 'PAUSED'
      ? 'border-amber-500/35 bg-amber-500/10'
      : liveStatus.status === 'OPEN' || liveStatus.status === 'CLOSING_SOON'
        ? 'border-emerald-500/35 bg-emerald-500/10'
        : 'border-slate-600/40 bg-slate-900/50';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t.title}</h2>
        <p className="text-sm text-slate-500">{t.description}</p>
      </div>

      <div className={`rounded-2xl border px-4 py-4 ${statusCardClass}`}>
        <p className="text-sm font-bold text-slate-100">{statusHeadline}</p>
        <p className="mt-1 text-xs text-slate-300">{todayHoursLine}</p>
        {todaySpecial ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-cockpit-500/40 bg-cockpit-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cockpit-200">
            <CalendarDays className="h-3 w-3" />
            {t.specialDayBadge}
          </span>
        ) : null}
      </div>

      <div
        className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition-colors ${
          isOpen ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {isOpen ? t.acceptingOrders : t.stoppedOrders}
          </p>
          <p className="text-xs text-slate-400">{isOpen ? t.acceptingOrdersHint : t.stoppedOrdersHint}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            isOpen ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
          role="switch"
          aria-checked={isOpen}
          aria-label={isOpen ? t.acceptingOrders : t.stoppedOrders}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition-transform ${
              isOpen ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {settings?.offline_until && new Date(settings.offline_until).getTime() > Date.now() ? (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <p>
            {t.pauseActive.replace(
              '{time}',
              new Date(settings.offline_until).toLocaleString('en-GB', {
                timeZone: 'Asia/Baku',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }),
            )}
          </p>
          <button
            type="button"
            onClick={() =>
              void updateSettings({ is_open: true, offline_until: null }).then(({ error }) => {
                if (error) onError(`${t.saveError}: ${error.message}`);
                else onSaved(t.saved);
              })
            }
            className="self-start rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/30"
          >
            {t.cancelPause}
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{t.weeklyHours}</p>
          <p className="text-xs text-slate-500">{t.hoursHint}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          {DAY_KEYS.map((key) => {
            const day = hours[key];
            const summary = day.closed ? t.closed : `${day.open} – ${day.close}`;
            return (
              <div
                key={key}
                className="flex flex-col gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-[5rem]">
                  <p className="text-sm font-semibold text-slate-200">{dayLabel[key]}</p>
                  <p className="text-xs text-slate-500">{summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-white/10 bg-slate-950/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateDay(key, { closed: false })}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        !day.closed
                          ? 'bg-cockpit-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.dayOpen}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDay(key, { closed: true })}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        day.closed
                          ? 'bg-slate-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.closed}
                    </button>
                  </div>
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    disabled={day.closed}
                    aria-label={`${dayLabel[key]} ${t.open}`}
                    className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 disabled:opacity-40 focus:border-cockpit-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">–</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    disabled={day.closed}
                    aria-label={`${dayLabel[key]} ${t.close}`}
                    className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 disabled:opacity-40 focus:border-cockpit-500 focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-200">{t.specialDaysTitle}</p>
            <p className="text-xs text-slate-500">{t.specialDaysHint}</p>
          </div>
          <button
            type="button"
            onClick={addSpecialDay}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" />
            {t.specialDayAdd}
          </button>
        </div>
        {specialDays.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-500">
            {t.specialDaysHint}
          </p>
        ) : (
          <div className="space-y-3">
            {[...specialDays]
              .map((row, index) => ({ row, index }))
              .sort((a, b) => a.row.date.localeCompare(b.row.date))
              .map(({ row, index }) => (
                <div key={`${row.date}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <label className="space-y-1 text-xs">
                      <span className="font-medium text-slate-400">{t.specialDayDate}</span>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateSpecialDay(index, { date: e.target.value })}
                        className="block rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1.5 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSpecialDay(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.specialDayRemove}
                    </button>
                  </div>
                  <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-slate-950/40 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateSpecialDay(index, { closed: true })}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        row.closed ? 'bg-slate-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {t.specialDayClosedAllDay}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSpecialDay(index, { closed: false })}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        !row.closed ? 'bg-cockpit-500 text-white' : 'text-slate-400'
                      }`}
                    >
                      {t.specialDayCustomHours}
                    </button>
                  </div>
                  {!row.closed ? (
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={row.open ?? '10:00'}
                        onChange={(e) => updateSpecialDay(index, { open: e.target.value })}
                        className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 focus:border-cockpit-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">–</span>
                      <input
                        type="time"
                        value={row.close ?? '23:00'}
                        onChange={(e) => updateSpecialDay(index, { close: e.target.value })}
                        className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 focus:border-cockpit-500 focus:outline-none"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">{t.specialDayNote}</p>
                    <p className="text-[11px] text-slate-500">{t.specialDayNoteHint}</p>
                    <textarea
                      value={row.note_en ?? ''}
                      onChange={(e) => updateSpecialDay(index, { note_en: e.target.value })}
                      placeholder={t.specialDayNoteEn}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
                    />
                    <textarea
                      value={row.note_az ?? ''}
                      onChange={(e) => updateSpecialDay(index, { note_az: e.target.value })}
                      placeholder={t.specialDayNoteAz}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
                    />
                    <textarea
                      value={row.note_ru ?? ''}
                      onChange={(e) => updateSpecialDay(index, { note_ru: e.target.value })}
                      placeholder={t.specialDayNoteRu}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm">
          <span className="font-medium text-slate-200">{t.deliveryEnabled}</span>
          <input
            type="checkbox"
            checked={deliveryEnabled}
            onChange={(e) => setDeliveryEnabled(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-cockpit-500"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-3 text-sm">
          <span className="font-medium text-slate-200">{t.takeawayEnabled}</span>
          <input
            type="checkbox"
            checked={takeawayEnabled}
            onChange={(e) => setTakeawayEnabled(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-cockpit-500"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-400">{t.globalMinOrder} (₼)</span>
          <input
            type="number"
            step="0.01"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-400">{t.defaultPrep}</span>
          <input
            type="number"
            value={defaultPrep}
            onChange={(e) => setDefaultPrep(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
          />
          <span className="block text-[11px] text-slate-500">{t.defaultPrepHint}</span>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-400">{t.globalFreeThreshold} (₼)</span>
          <input
            type="number"
            step="0.01"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(e.target.value)}
            placeholder="—"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
          />
        </label>
        <div className="space-y-1 text-xs sm:col-span-2">
          <span className="font-medium text-slate-300">{t.kitchenLocationTitle}</span>
          <p className="text-[11px] text-slate-500">{t.kitchenLocationHint}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="font-medium text-slate-400">{t.kitchenLatitude}</span>
              <input
                type="number"
                step="0.000001"
                value={kitchenLat}
                onChange={(e) => setKitchenLat(e.target.value)}
                placeholder="40.377700"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-400">{t.kitchenLongitude}</span>
              <input
                type="number"
                step="0.000001"
                value={kitchenLng}
                onChange={(e) => setKitchenLng(e.target.value)}
                placeholder="49.892000"
                className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cockpit-500 focus:outline-none"
              />
            </label>
          </div>
        </div>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-slate-400">{t.dispatchMode}</span>
          <select
            value={dispatchMode}
            onChange={(e) => setDispatchMode(e.target.value as 'auto' | 'manual')}
            className="cockpit-select w-full"
          >
            <option value="auto">{t.dispatchAuto}</option>
            <option value="manual">{t.dispatchManual}</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1 text-xs">
        <span className="font-medium text-slate-400">{t.closingSoonMinutesLabel}</span>
        <input
          type="number"
          min={0}
          max={240}
          value={closingSoonMinutes}
          onChange={(e) => setClosingSoonMinutes(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 focus:border-cockpit-500 focus:outline-none"
        />
        <span className="block text-[11px] text-slate-500">{t.closingSoonMinutesHint}</span>
      </label>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 rounded-xl bg-cockpit-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cockpit-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
          {saving ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}
