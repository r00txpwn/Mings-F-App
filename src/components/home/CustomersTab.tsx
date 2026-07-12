import { DashboardEmptyState } from './DashboardEmptyState';
import { useLanguage } from '../../contexts/LanguageContext';

export function CustomersTab() {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <DashboardEmptyState message={t.dashboardEmptyCustomers} />
      <p className="text-xs text-slate-500 dark:text-slate-400">{t.dashboardCustomersHint}</p>
    </div>
  );
}
