import type {
  DashboardOperationalData,
  PayoutReconciliationSummary,
} from '../../types/analytics';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';

interface OperationalStripProps {
  data: DashboardOperationalData | null;
  payout: PayoutReconciliationSummary | null;
  loading?: boolean;
}

function sourceLabel(source: string, t: ReturnType<typeof useLanguage>['t']) {
  if (source === 'kiosk') return t.kiosk;
  if (source === 'manual') return t.manual;
  if (source === 'online_delivery') return t.onlineDelivery;
  if (source === 'online_takeaway') return t.onlineTakeaway;
  if (source === 'pos_eat_in') return `${t.pos} · ${t.posFulfillmentEatIn}`;
  if (source === 'pos_takeaway') return `${t.pos} · ${t.posFulfillmentTakeaway}`;
  if (source === 'pos_delivery') return `${t.pos} · ${t.posFulfillmentDelivery}`;
  return source;
}

export function OperationalStrip({ data, payout, loading }: OperationalStripProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="sm" className="h-24 animate-pulse bg-slate-100 dark:bg-slate-800">
            <span className="sr-only">Loading</span>
          </Card>
        ))}
      </div>
    );
  }

  const topSources = (data?.orderSourceMix ?? []).slice(0, 3);
  const prep = data?.prepTime;
  const payment = data?.paymentHealth;
  const commission = Math.max(0, (payout?.totalExpected ?? 0) - (payout?.totalActual ?? 0));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card padding="sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{t.orderSourceMix}</p>
        {topSources.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t.noDataForPeriod}</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {topSources.map((item) => (
              <li key={item.source} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">{sourceLabel(item.source, t)}</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {item.sharePct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card padding="sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{t.avgPrepTime}</p>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-slate-900 dark:text-white">
          {prep?.avgPrepMinutes != null ? `${prep.avgPrepMinutes.toFixed(0)}m` : '—'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {prep?.slaMetPct != null
            ? `${t.kitchenSla}: ${prep.slaMetPct.toFixed(0)}%`
            : `${prep?.ordersWithPrep ?? 0} ${t.orders}`}
        </p>
      </Card>

      <Card padding="sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{t.paymentHealth}</p>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
          {payment?.paidCount ?? 0} {t.paidOrders}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {(payment?.unpaidCount ?? 0) > 0
            ? `${payment?.unpaidCount} ${t.unpaidOrders}`
            : `${payment?.cardCount ?? 0} ${t.cardPayments} • ${payment?.codCount ?? 0} ${t.codPayments}`}
        </p>
      </Card>

      <Card padding="sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{t.payoutCommission}</p>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400">
          ₼{commission.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {t.matchedPayouts}: {payout?.matchedCount ?? 0} • {t.mismatchedPayouts}:{' '}
          {payout?.mismatchedCount ?? 0} • {t.pendingPayouts}: {payout?.pendingCount ?? 0}
        </p>
      </Card>
    </div>
  );
}
