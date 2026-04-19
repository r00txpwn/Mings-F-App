import type { SaleItem } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderItemSummaryProps {
  items: SaleItem[] | undefined;
  compact?: boolean;
}

export function OrderItemSummary({ items, compact = false }: OrderItemSummaryProps) {
  const { t } = useLanguage();
  const rows = items ?? [];
  const visibleRows = compact ? rows.slice(0, 4) : rows;

  return (
    <ul className="space-y-1 text-xs text-slate-200">
      {visibleRows.map((item) => {
        const modifiers = (item.sale_item_modifiers ?? []).map((m) => m.modifier_option_name).filter(Boolean);
        return (
          <li key={item.id} className="rounded-md bg-white/5 px-2 py-1">
            <p>
              {item.quantity}x {item.product_name}
            </p>
            {modifiers.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                {modifiers.map((modifierName, idx) => (
                  <li key={`${item.id}-mod-${idx}`} className="pl-2">
                    - {modifierName}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
      {compact && rows.length > visibleRows.length ? (
        <li className="text-[11px] text-slate-500">+{rows.length - visibleRows.length} {t.items}</li>
      ) : null}
    </ul>
  );
}
