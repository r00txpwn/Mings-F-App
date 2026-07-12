import type { DashboardTabId } from '../../types/analytics';
import { useLanguage } from '../../contexts/LanguageContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/shadcn/tabs';

interface DashboardTabNavProps {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
}

const TABS: DashboardTabId[] = ['overview', 'kitchen', 'finance', 'customers'];

export function DashboardTabNav({ activeTab, onChange }: DashboardTabNavProps) {
  const { t } = useLanguage();

  const labelFor = (tab: DashboardTabId) => {
    if (tab === 'overview') return t.dashboardTabOverview;
    if (tab === 'kitchen') return t.dashboardTabKitchen;
    if (tab === 'finance') return t.dashboardTabFinance;
    return t.dashboardTabCustomers;
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => onChange(v as DashboardTabId)} className="mb-4">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/60 p-1">
        {TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-none rounded-md px-3 py-2">
            {labelFor(tab)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
