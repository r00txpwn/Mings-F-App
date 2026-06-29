import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { adminUpdate } from '../lib/adminApi';
import { useLanguage } from '../contexts/LanguageContext';
import { getKitchenStatus, nextOpenBoundary, type KitchenSettings } from '../lib/kitchenAcceptance';
import type { OnlineSettingsRow } from '../types/online';
import { expireOnlineKitchenPauseIfDue } from '../order/orderOnlineSettings';

function formatBaku(iso: string, localeCode: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(localeCode, {
    timeZone: 'Asia/Baku',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function KitchenStatusPanel() {
  const { t, language } = useLanguage();
  const localeCode = language === 'az' ? 'az-AZ' : language === 'ru' ? 'ru-RU' : 'en-GB';
  const [settings, setSettings] = useState<OnlineSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    await expireOnlineKitchenPauseIfDue(supabase);
    const { data, error } = await supabase
      .from('online_settings')
      .select('id, is_open, hours_json, offline_until, closing_soon_minutes')
      .limit(1)
      .maybeSingle();
    if (error) {
      setErr(error.message);
      setSettings(null);
    } else {
      setErr(null);
      setSettings((data ?? null) as OnlineSettingsRow | null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const ch = supabase
      .channel('om-online-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'online_settings' },
        (payload) => {
          const row = payload.new as OnlineSettingsRow | null;
          if (row && typeof row === 'object' && 'id' in row) {
            setSettings(row);
            return;
          }
          void reload();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [reload]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((x) => x + 1);
      void (async () => {
        await expireOnlineKitchenPauseIfDue(supabase);
        await reload();
      })();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [reload]);

  const ks = settings as KitchenSettings | null;
  void tick;

  const immediate = useMemo(() => {
    void tick;
    if (!ks) return { status: 'OPEN' as const };
    return getKitchenStatus(ks, new Date(), { orderMode: 'immediate' });
  }, [ks, tick]);

  const nextOpen = useMemo(() => {
    void tick;
    if (!ks) return null;
    return nextOpenBoundary(ks, new Date());
  }, [ks, tick]);

  const applyPatch = async (patch: Partial<OnlineSettingsRow>) => {
    if (!settings?.id) return;
    setSaving(true);
    setErr(null);
    const result = await adminUpdate('online_settings', settings.id, patch);
    setSaving(false);
    if (!result.ok) {
      setErr(result.error ?? 'Update failed');
      return;
    }
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const onPause30 = () => {
    const until = new Date(Date.now() + 30 * 60_000).toISOString();
    void applyPatch({ is_open: false, offline_until: until });
  };

  const onPause60 = () => {
    const until = new Date(Date.now() + 60 * 60_000).toISOString();
    void applyPatch({ is_open: false, offline_until: until });
  };

  const onPauseUntilOpen = () => {
    if (!ks) return;
    const nb = nextOpenBoundary(ks, new Date());
    if (!nb) {
      setErr(t.omKitchenNoNextOpen);
      return;
    }
    void applyPatch({ is_open: false, offline_until: nb.toISOString() });
  };

  const onPauseIndefinite = () => {
    void applyPatch({ is_open: false, offline_until: null });
  };

  const onResume = () => {
    void applyPatch({ is_open: true, offline_until: null });
  };

  if (loading) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t.orderLoadingMenu}
      </div>
    );
  }

  if (!settings) {
    return null;
  }

  const pausedTimed =
    settings.is_open === false &&
    settings.offline_until &&
    new Date(settings.offline_until).getTime() > Date.now();
  const pausedIndef = settings.is_open === false && !settings.offline_until;

  let statusLine = t.omKitchenStatusOnline;
  let statusClass = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
  if (immediate.status === 'CLOSING_SOON') {
    statusLine = t.omKitchenStatusOnline;
    statusClass = 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  } else if (immediate.status === 'CLOSED') {
    statusLine = t.omKitchenStatusClosed;
    statusClass = 'border-slate-600 bg-slate-900/60 text-slate-300';
  } else if (pausedTimed) {
    statusLine = t.omKitchenStatusPausedUntil.replace(
      '{time}',
      formatBaku(settings.offline_until!, localeCode),
    );
    statusClass = 'border-amber-500/40 bg-amber-500/10 text-amber-100';
  } else if (pausedIndef) {
    statusLine = t.omKitchenStatusOffline;
    statusClass = 'border-rose-500/40 bg-rose-500/10 text-rose-100';
  }

  return (
    <div className={`mb-3 rounded-xl border px-3 py-3 text-xs ${statusClass}`}>
      <p className="font-bold text-sm text-slate-100">{t.omKitchenStatusTitle}</p>
      <p className="mt-1 font-medium">{statusLine}</p>
      <p className="mt-1 text-[11px] opacity-80">{t.omKitchenStatusHint}</p>
      {err ? <p className="mt-2 text-[11px] text-rose-300">{err}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void onPause30()}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-40"
        >
          {t.omKitchenPause30}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onPause60()}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-40"
        >
          {t.omKitchenPause60}
        </button>
        <button
          type="button"
          disabled={saving || !nextOpen}
          onClick={() => void onPauseUntilOpen()}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-40"
        >
          {t.omKitchenPauseUntilNextOpen}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onPauseIndefinite()}
          className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 font-semibold hover:bg-white/10 disabled:opacity-40"
        >
          {t.omKitchenPauseIndefinite}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void onResume()}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-1.5 font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-40"
        >
          {t.omKitchenResume}
        </button>
      </div>
    </div>
  );
}
