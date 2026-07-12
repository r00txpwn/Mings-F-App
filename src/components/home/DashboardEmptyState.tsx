import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '@/components/shadcn/card';

interface DashboardEmptyStateProps {
  message: string;
}

export function DashboardEmptyState({ message }: DashboardEmptyStateProps) {
  const { t } = useLanguage();
  return (
    <Card className="border-dashed bg-muted/30 px-4 py-8 text-center shadow-none">
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="mt-2 text-xs text-muted-foreground/80">{t.dashboardEmptyHint}</p>
    </Card>
  );
}
