import { useLanguage } from '../contexts/LanguageContext';

interface PosCustomerPanelProps {
  customerName: string;
  customerPhone: string;
  orderNotes: string;
  onCustomerNameChange: (v: string) => void;
  onCustomerPhoneChange: (v: string) => void;
  onOrderNotesChange: (v: string) => void;
}

export function PosCustomerPanel({
  customerName,
  customerPhone,
  orderNotes,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onOrderNotesChange,
}: PosCustomerPanelProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
      <h3 className="text-sm font-semibold text-cockpit-200">{t.posCustomerPanelTitle}</h3>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">{t.posCustomerName}</span>
        <input
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">{t.posCustomerPhone}</span>
        <input
          value={customerPhone}
          onChange={(e) => onCustomerPhoneChange(e.target.value)}
          placeholder="+994..."
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-slate-400">{t.posOrderNotes}</span>
        <textarea
          value={orderNotes}
          onChange={(e) => onOrderNotesChange(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
