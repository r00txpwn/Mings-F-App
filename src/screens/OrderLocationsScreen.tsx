import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FilterBar, OrderLocationsMap, getPresetDateRange, type DatePreset } from '../components/analytics';
import { StatCard } from '../components/ui';
import { Skeleton } from '../components/ui/Skeleton';
import {
  fetchOrderDeliveryLocations,
  type OrderLocationPoint,
  type OrderLocationSourceFilter,
} from '../services/analytics/orderLocationService';

const SOURCE_FILTERS: OrderLocationSourceFilter[] = ['all', 'online_delivery', 'pos_delivery'];

export function OrderLocationsScreen() {
  const { t } = useLanguage();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [{ startDate, endDate }, setDateRange] = useState(() => getPresetDateRange('this_month'));
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [sourceFilter, setSourceFilter] = useState<OrderLocationSourceFilter>('all');
  const [points, setPoints] = useState<OrderLocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPoints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrderDeliveryLocations(startDate, endDate, sourceFilter);
      setPoints(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorOccurred);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [endDate, sourceFilter, startDate, t.errorOccurred]);

  useEffect(() => {
    void loadPoints();
  }, [loadPoints]);

  const onlineCount = useMemo(
    () => points.filter((p) => p.source === 'online_delivery').length,
    [points],
  );
  const posCount = useMemo(() => points.filter((p) => p.source === 'pos_delivery').length, [points]);

  const sourceLabel = (src: OrderLocationSourceFilter) => {
    if (src === 'online_delivery') return t.orderLocationsSourceOnline;
    if (src === 'pos_delivery') return t.orderLocationsSourcePos;
    return t.orderLocationsSourceAll;
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h1 className="cockpit-page-title">{t.orderLocationsTitle}</h1>
        <p className="cockpit-page-sub">{t.orderLocationsSubtitle}</p>
      </div>

      <FilterBar
        selectedPreset={preset}
        onPresetChange={(next) => {
          setPreset(next);
          if (next !== 'custom') setDateRange(getPresetDateRange(next));
        }}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={(value) => {
          setPreset('custom');
          setDateRange((prev) => ({ ...prev, startDate: value }));
        }}
        onEndDateChange={(value) => {
          setPreset('custom');
          setDateRange((prev) => ({ ...prev, endDate: value }));
        }}
        channelFilter={
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_FILTERS.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  sourceFilter === src
                    ? 'bg-cockpit-600 text-white dark:bg-cockpit-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {sourceLabel(src)}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t.orderLocationsTotalOrders} value={loading ? '…' : points.length} />
        <StatCard label={t.orderLocationsSourceOnline} value={loading ? '…' : onlineCount} />
        <StatCard label={t.orderLocationsSourcePos} value={loading ? '…' : posCount} />
      </div>

      {error ? (
        <div className="cockpit-alert-error">{error}</div>
      ) : null}

      <div className="relative">
        {loading ? (
          <Skeleton className="h-[28rem] w-full rounded-xl" aria-label={t.cockpitLoadingContent} />
        ) : (
        <OrderLocationsMap
          apiKey={mapsApiKey}
          points={points}
          loadingLabel={t.orderLocationsLoading}
          unavailableLabel={t.orderLocationsUnavailable}
          emptyLabel={t.orderLocationsEmpty}
          hintLabel={t.orderLocationsMapHint}
          orderLabel={t.orderLocationsOrderLabel}
          totalLabel={t.trackingTotal}
        />
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-cockpit-400 ring-1 ring-slate-900/20" />
          {t.orderLocationsSourceOnline}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500 ring-1 ring-slate-900/20" />
          {t.orderLocationsSourcePos}
        </span>
      </div>
    </div>
  );
}
