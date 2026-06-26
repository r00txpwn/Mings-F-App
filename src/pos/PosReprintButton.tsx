import { Printer } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { OrderManagerOrder } from '../order-manager/types';
import { buildPrintLabelsFromSale } from './posLabelPayload';
import { sendLabelsToPrintAgent } from './posPrintClient';

interface PosReprintButtonProps {
  order: OrderManagerOrder;
  className?: string;
}

export function PosReprintButton({ order, className }: PosReprintButtonProps) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReprint = async () => {
    setBusy(true);
    setMessage(null);
    const items = order.sale_items ?? [];
    const labels = buildPrintLabelsFromSale(order, items);
    const result = await sendLabelsToPrintAgent(labels);
    if (result.ok) {
      setMessage(t.posPrintSent);
    } else if (result.queued) {
      setMessage(t.posPrintPending);
    } else {
      setMessage(t.posPrintFailed);
    }
    setBusy(false);
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy || !order.sale_items?.length}
        onClick={() => void handleReprint()}
        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
      >
        <Printer className="h-3.5 w-3.5" />
        {t.posReprintLabels}
      </button>
      {message ? <p className="mt-1 text-xs text-slate-400">{message}</p> : null}
    </div>
  );
}
