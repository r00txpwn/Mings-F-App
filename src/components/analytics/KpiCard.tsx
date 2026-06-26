import { StatCard } from '../ui/StatCard';

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  subtitle?: string;
}

/** Analytics KPI card — wraps StatCard for backward compatibility. */
export function KpiCard(props: KpiCardProps) {
  return <StatCard {...props} />;
}
