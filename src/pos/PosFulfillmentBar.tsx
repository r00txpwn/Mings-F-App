import { useLanguage } from '../contexts/LanguageContext';

export type PosFulfillmentType = 'eat_in' | 'takeaway' | 'delivery';

interface PosFulfillmentBarProps {
  value: PosFulfillmentType;
  onChange: (next: PosFulfillmentType) => void;
}

export function PosFulfillmentBar({ value, onChange }: PosFulfillmentBarProps) {
  const { t } = useLanguage();
  const options: Array<{ id: PosFulfillmentType; label: string }> = [
    { id: 'eat_in', label: t.posFulfillmentEatIn },
    { id: 'takeaway', label: t.posFulfillmentTakeaway },
    { id: 'delivery', label: t.posFulfillmentDelivery },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            value === opt.id
              ? 'bg-cockpit-500 text-white'
              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
