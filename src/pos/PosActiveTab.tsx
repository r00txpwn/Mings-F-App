import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ActiveOrdersTab } from '../order-manager/ActiveOrdersTab';
import { startPrintQueueFlusher } from './posPrintClient';

interface PosActiveTabProps {
  accessToken: string | null;
  onGoNewOrder?: () => void;
}

export function PosActiveTab({ accessToken }: PosActiveTabProps) {
  const { t } = useLanguage();
  const [pendingPrints, setPendingPrints] = useState(0);

  useEffect(() => {
    return startPrintQueueFlusher(setPendingPrints);
  }, []);

  return (
    <div className="space-y-3">
      {pendingPrints > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {t.posPrintPendingCount.replace('{count}', String(pendingPrints))}
        </div>
      ) : null}
      <ActiveOrdersTab accessToken={accessToken} showReprint />
    </div>
  );
}
