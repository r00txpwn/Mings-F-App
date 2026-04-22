import { useEffect, useMemo, useState } from 'react';
import { Save, Sparkles } from 'lucide-react';
import type { DispatchMode, OnlineSettingsRow } from '../../types/online';

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
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type DayKey = typeof DAY_KEYS[number];

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
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('auto');
  const [hours, setHours] = useState<HoursState>(() => readHoursJson(null));
  const [closingSoonMinutes, setClosingSoonMinutes] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setIsOpen(settings.is_open !== false);
    setDeliveryEnabled(Boolean(settings.delivery_enabled));
    setTakeawayEnabled(Boolean(settings.takeaway_enabled));
    setMinOrder(String(settings.min_order_amount ?? 0));
    setDefaultPrep(String(settings.default_prep_time_minutes ?? 25));
    setFreeThreshold(
      settings.free_delivery_threshold != null ? String(settings.free_delivery_threshold) : '',
    );
    setKitchenLat(settings.kitchen_lat != null ? String(settings.kitchen_lat) : '');
    setKitchenLng(settings.kitchen_lng != null ? String(settings.kitchen_lng) : '');
    setDispatchMode(settings.dispatch_mode === 'manual' ? 'manual' : 'auto');
    setHours(readHoursJson(settings.hours_json as Record<string, unknown>));
    setClosingSoonMinutes(String(settings.closing_soon_minutes ?? 0));
  }, [settings]);

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
    setSaving(true);
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
      closing_soon_minutes: Math.max(0, Math.min(240, Math.floor(Number(closingSoonMinutes) || 0))),
    });
    setSaving(false);
    if (error) onError(`${t.saveError}: ${error.message}`);
    else onSaved(t.saved);
  };

  const updateDay = (key: DayKey, patch: Partial<DayHours>) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{t.title}</h2>
        <p className="text-sm text-slate-500">{t.description}</p>
      </div>

      <div
        className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition-colors ${
          isOpen
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-rose-500/30 bg-rose-500/10'
        }`}
      >
        <div>
          <p className="text-sm font-semibold text-slate-100">{t.kitchenOpen}</p>
          <p className="text-xs text-slate-400">{t.kitchenOpenHint}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            isOpen ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
          role="switch"
          aria-checked={isOpen}
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
            onClick={() => void updateSettings({ is_open: true, offline_until: null }).then(({ error }) => {
              if (error) onError(`${t.saveError}: ${error.message}`);
              else onSaved(t.saved);
            })}
            className="self-start rounded-lg border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold hover:bg-amber-500/30"
          >
            {t.cancelPause}
          </button>
        </div>
      ) : null}

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
            onChange={(e) => setDispatchMode(e.target.value as DispatchMode)}
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

      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-slate-200">{t.hours}</p>
          <p className="text-xs text-slate-500">{t.hoursHint}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 border-b border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span></span>
            <span>{t.closed}</span>
            <span>{t.open}</span>
            <span>{t.close}</span>
          </div>
          {DAY_KEYS.map((key) => {
            const day = hours[key];
            return (
              <div
                key={key}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2 text-sm"
              >
                <span className="w-8 text-xs font-medium text-slate-300">{dayLabel[key]}</span>
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => updateDay(key, { closed: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-cockpit-500"
                />
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => updateDay(key, { open: e.target.value })}
                  disabled={day.closed}
                  className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 disabled:opacity-40 focus:border-cockpit-500 focus:outline-none"
                />
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => updateDay(key, { close: e.target.value })}
                  disabled={day.closed}
                  className="rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-xs text-slate-100 disabled:opacity-40 focus:border-cockpit-500 focus:outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>

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
