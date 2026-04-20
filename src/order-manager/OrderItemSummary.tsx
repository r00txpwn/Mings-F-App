import type { SaleItem } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderItemSummaryProps {
  items: SaleItem[] | undefined;
  compact?: boolean;
}

const COMPACT_VISIBLE_ROWS = 4;
const COMPACT_VISIBLE_MODIFIERS_PER_ITEM = 3;

function normalizeModifierLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function OrderItemSummary({ items, compact = false }: OrderItemSummaryProps) {
  const { t } = useLanguage();
  const rows = items ?? [];
  const visibleRows = compact ? rows.slice(0, COMPACT_VISIBLE_ROWS) : rows;

  return (
    <ul className="space-y-1 text-xs text-slate-200">
      {visibleRows.map((item) => {
        const modifierGroups = new Map<
          string,
          {
            group: string;
            options: Map<string, { option: string; count: number }>;
            totalSelections: number;
          }
        >();

        for (const modifier of item.sale_item_modifiers ?? []) {
          const option = normalizeModifierLabel(String(modifier.modifier_option_name ?? ''));
          if (!option) continue;
          const group = normalizeModifierLabel(String(modifier.modifier_group_name ?? ''));

          const groupKey = (group || 'modifier').toLowerCase();
          const optionKey = option.toLowerCase();

          const existingGroup = modifierGroups.get(groupKey);
          if (!existingGroup) {
            modifierGroups.set(groupKey, {
              group: group || 'Modifier',
              options: new Map([[optionKey, { option, count: 1 }]]),
              totalSelections: 1,
            });
          } else {
            const existingOption = existingGroup.options.get(optionKey);
            if (existingOption) {
              existingOption.count += 1;
            } else {
              existingGroup.options.set(optionKey, { option, count: 1 });
            }
            existingGroup.totalSelections += 1;
          }
        }

        const modifierLines: string[] = [];
        for (const groupEntry of modifierGroups.values()) {
          const optionsInGroup = [...groupEntry.options.values()];
          for (const optionEntry of optionsInGroup) {
            const shouldShowCount =
              optionEntry.count > 1 || optionsInGroup.length > 1 || groupEntry.totalSelections > 1;
            const optionLabel = shouldShowCount
              ? `${optionEntry.count} x ${optionEntry.option}`
              : optionEntry.option;
            modifierLines.push(`${groupEntry.group}: ${optionLabel}`);
          }
        }

        const visibleModifiers = compact
          ? modifierLines.slice(0, COMPACT_VISIBLE_MODIFIERS_PER_ITEM)
          : modifierLines;

        return (
          <li key={item.id} className="rounded-md bg-white/5 px-2 py-1">
            <p className="break-words">
              {item.quantity} x {item.product_name}
            </p>
            {modifierLines.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-400">
                {visibleModifiers.map((line, idx) => (
                  <li key={`${item.id}-mod-${idx}`} className="pl-2">
                    - {line}
                  </li>
                ))}
                {compact && modifierLines.length > visibleModifiers.length ? (
                  <li className="pl-2 text-slate-500">
                    +{modifierLines.length - visibleModifiers.length} {t.items}
                  </li>
                ) : null}
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
