import type { AccountBalances } from '../../services/finance/accounts';
import type {
  ChannelPerformance,
  DashboardGroupAData,
  DashboardOperationalData,
  ExecutiveKpis,
  ExpenseBreakdownData,
  PayoutReconciliationSummary,
  RevenueCostTrendPoint,
} from '../../types/analytics';

export interface HomeKpiCard {
  label: string;
  value: string;
  subtitle: string;
  delta?: { text: string; trend: 'up' | 'down' | 'neutral' };
  trendOverride?: 'up' | 'down' | 'neutral';
}

export interface HomeDashboardViewProps {
  loading: boolean;
  kpis: ExecutiveKpis;
  previousKpis: ExecutiveKpis | null;
  comparePrevious: boolean;
  trendData: RevenueCostTrendPoint[];
  channelPerformance: ChannelPerformance[];
  expenseBreakdown: ExpenseBreakdownData | null;
  payoutReconciliation: PayoutReconciliationSummary | null;
  operationalData: DashboardOperationalData | null;
  groupA: DashboardGroupAData | null;
  accountBalances: AccountBalances | null;
  outstandingDebt: number | null;
  weekdayLabels: string[];
  deltaFor: (current: number, previous: number | undefined) => HomeKpiCard['delta'];
}
