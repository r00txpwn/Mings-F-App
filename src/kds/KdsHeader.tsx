import {
  ChefHat,
  Globe,
  History,
  LogOut,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../translations';
import type { KdsSourceFilter } from './kdsBoardUtils';

interface KdsHeaderProps {
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  realtimeStatus: 'connected' | 'reconnecting';
  now: number;
  sourceFilter: KdsSourceFilter;
  onSourceFilterChange: (filter: KdsSourceFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onHistoryOpen?: () => void;
  onSignOut?: () => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'az', label: 'AZ' },
  { code: 'ru', label: 'RU' },
];

const FILTER_OPTIONS: {
  value: KdsSourceFilter;
  labelKey:
    | 'kdsFilterAll'
    | 'kdsChannelDelivery'
    | 'kdsChannelTakeaway'
    | 'kdsChannelKiosk'
    | 'kdsChannelPosEatIn'
    | 'kdsChannelPosTakeaway'
    | 'kdsChannelPosDelivery';
  activeClass: string;
}[] = [
  { value: 'all', labelKey: 'kdsFilterAll', activeClass: 'bg-violet-600 text-white shadow-sm shadow-violet-900/40' },
  {
    value: 'online_delivery',
    labelKey: 'kdsChannelDelivery',
    activeClass: 'bg-rose-500 text-white shadow-sm shadow-rose-900/30',
  },
  {
    value: 'online_takeaway',
    labelKey: 'kdsChannelTakeaway',
    activeClass: 'bg-orange-500 text-white shadow-sm shadow-orange-900/30',
  },
  {
    value: 'kiosk',
    labelKey: 'kdsChannelKiosk',
    activeClass: 'bg-amber-400 text-gray-900 shadow-sm shadow-amber-900/20',
  },
  {
    value: 'pos_eat_in',
    labelKey: 'kdsChannelPosEatIn',
    activeClass: 'bg-violet-500 text-white shadow-sm shadow-violet-900/30',
  },
  {
    value: 'pos_takeaway',
    labelKey: 'kdsChannelPosTakeaway',
    activeClass: 'bg-indigo-500 text-white shadow-sm shadow-indigo-900/30',
  },
  {
    value: 'pos_delivery',
    labelKey: 'kdsChannelPosDelivery',
    activeClass: 'bg-fuchsia-500 text-white shadow-sm shadow-fuchsia-900/30',
  },
];

function StatChip({
  count,
  label,
  dotClass,
  textClass,
}: {
  count: number;
  label: string;
  dotClass: string;
  textClass: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span className={`text-sm font-semibold tabular-nums ${textClass}`}>{count}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    </div>
  );
}

export function KdsHeader({
  pendingCount,
  preparingCount,
  readyCount,
  realtimeStatus,
  now,
  sourceFilter,
  onSourceFilterChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  onHistoryOpen,
  onSignOut,
}: KdsHeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const time = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const connected = realtimeStatus === 'connected';

  return (
    <header className="shrink-0 border-b border-violet-500/20 bg-slate-950/90 shadow-neon-soft backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-neon-soft">
              <ChefHat className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-tight tracking-tight text-white sm:text-lg">
                {t.kitchenDisplay}
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                {connected ? t.connected : t.reconnecting}
              </p>
            </div>
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <StatChip
              count={pendingCount}
              label={t.pending}
              dotClass="bg-violet-400"
              textClass="text-violet-200"
            />
            <StatChip
              count={preparingCount}
              label={t.preparing}
              dotClass="bg-cyan-400"
              textClass="text-cyan-200"
            />
            <StatChip
              count={readyCount}
              label={t.ready}
              dotClass="bg-emerald-400"
              textClass="text-emerald-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
              connected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <WifiOff className="h-3.5 w-3.5 animate-pulse" aria-hidden />
            )}
            <span className="font-medium">{connected ? t.connected : t.reconnecting}</span>
          </div>
          <time className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 font-mono text-sm tabular-nums text-slate-200">
            {time}
          </time>
          <div className="flex items-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-0.5">
            <Globe className="ml-1.5 h-3.5 w-3.5 text-violet-300/80" aria-hidden />
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-800/80 px-4 py-2.5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSourceFilterChange(opt.value)}
              className={`min-h-[36px] touch-manipulation rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                sourceFilter === opt.value
                  ? opt.activeClass
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              {t[opt.labelKey]}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.kdsSearchPlaceholder}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/80 text-slate-300 transition-colors hover:border-violet-500/30 hover:bg-slate-800 hover:text-white"
            aria-label={t.refreshOrders}
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {onHistoryOpen ? (
            <button
              type="button"
              onClick={onHistoryOpen}
              className="flex h-11 shrink-0 touch-manipulation items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/30 hover:bg-slate-800 hover:text-white"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">{t.kdsHistoryTitle}</span>
            </button>
          ) : null}

          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              className="flex h-11 shrink-0 touch-manipulation items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-violet-500/30 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t.staffSignOut}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-800/60 px-4 py-2 sm:hidden">
        <StatChip
          count={pendingCount}
          label={t.pending}
          dotClass="bg-violet-400"
          textClass="text-violet-200"
        />
        <StatChip
          count={preparingCount}
          label={t.preparing}
          dotClass="bg-cyan-400"
          textClass="text-cyan-200"
        />
        <StatChip
          count={readyCount}
          label={t.ready}
          dotClass="bg-emerald-400"
          textClass="text-emerald-200"
        />
      </div>
    </header>
  );
}
