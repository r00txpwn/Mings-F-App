import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { DangerConfirmRow } from '../../components/ui/DangerConfirmRow';
import { IconActionButton } from '../../components/ui/IconActionButton';
import { useLanguage } from '../../contexts/LanguageContext';

interface GroupedItem {
  id: string;
  date: string;
  subItemName: string;
  amount: number;
  description?: string;
  paymentMethod?: string;
  productName?: string;
  supplierName?: string;
  quantity?: number;
  unitCost?: number;
  paymentStatus?: string;
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  items: GroupedItem[];
}

interface CategoryGroupedViewProps {
  groups: CategoryGroup[];
  type: 'operational' | 'cogs';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

export function CategoryGroupedView({ groups, type, onEdit, onDelete, currency = '₼' }: CategoryGroupedViewProps) {
  const { t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(groups[0] ? [groups[0].categoryId] : []));
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const grandTotal = groups.reduce((sum, group) => sum + group.total, 0);

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isExpanded = expandedCategories.has(group.categoryId);

        return (
          <div
            key={group.categoryId}
            className="cockpit-panel-solid overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(group.categoryId)}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.categoryColor }}
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {group.categoryName}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {group.items.length}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {grandTotal > 0 ? `${((group.total / grandTotal) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {currency}{group.total.toFixed(2)}
              </span>
            </button>
            <div className="px-5 pb-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/70">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${grandTotal > 0 ? (group.total / grandTotal) * 100 : 0}%`,
                    backgroundColor: group.categoryColor,
                  }}
                />
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/60">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t.date}</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                        {t.item}
                      </th>
                      {type === 'cogs' && (
                        <>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t.supplier}</th>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t.quantity}</th>
                        </>
                      )}
                      {type === 'operational' && (
                        <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t.payment}</th>
                      )}
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">{t.description}</th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400">{t.amount}</th>
                      <th className="w-20 px-5 py-2.5 text-right text-xs font-medium text-slate-500 dark:text-slate-400"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {group.items.map((item) => {
                      if (deleteConfirm === item.id) {
                        return (
                          <tr key={item.id} className="bg-red-50 dark:bg-red-900/20">
                            <td colSpan={type === 'cogs' ? 7 : 6} className="px-5 py-3">
                              <DangerConfirmRow
                                message={`${t.delete} ${t.item}?`}
                                onConfirm={() => { onDelete(item.id); setDeleteConfirm(null); }}
                                onCancel={() => setDeleteConfirm(null)}
                              />
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">
                            {item.subItemName || '-'}
                          </td>
                          {type === 'cogs' && (
                            <>
                              <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                                {item.supplierName || '-'}
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                                {item.quantity || '-'}
                              </td>
                            </>
                          )}
                          {type === 'operational' && (
                            <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                              {item.paymentMethod || '-'}
                            </td>
                          )}
                          <td className="max-w-[200px] truncate px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {item.description || '-'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-sm font-semibold text-slate-900 dark:text-white">
                            {currency}{item.amount.toFixed(2)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconActionButton
                                onClick={() => onEdit(item.id)}
                                icon={<Edit2 className="h-3.5 w-3.5" />}
                                tone="edit"
                                label={t.edit}
                                className="h-8 w-8"
                              />
                              <IconActionButton
                                onClick={() => setDeleteConfirm(item.id)}
                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                tone="danger"
                                label={t.delete}
                                className="h-8 w-8"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
