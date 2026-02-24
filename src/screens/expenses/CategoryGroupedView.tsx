import { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow hover:shadow-sm"
          >
            <button
              onClick={() => toggleCategory(group.categoryId)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.categoryColor }}
                />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {group.categoryName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {group.items.length}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {currency}{group.total.toFixed(2)}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/40">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Item
                      </th>
                      {type === 'cogs' && (
                        <>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Supplier</th>
                          <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Qty</th>
                        </>
                      )}
                      {type === 'operational' && (
                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Payment</th>
                      )}
                      <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Description</th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                    {group.items.map((item) => {
                      if (deleteConfirm === item.id) {
                        return (
                          <tr key={item.id} className="bg-red-50 dark:bg-red-900/20">
                            <td colSpan={type === 'cogs' ? 7 : 6} className="px-5 py-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-red-800 dark:text-red-200">Delete this entry?</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { onDelete(item.id); setDeleteConfirm(null); }}
                                    className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md font-medium"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                          <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-900 dark:text-white font-medium">
                            {item.subItemName || '-'}
                          </td>
                          {type === 'cogs' && (
                            <>
                              <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">
                                {item.supplierName || '-'}
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">
                                {item.quantity || '-'}
                              </td>
                            </>
                          )}
                          {type === 'operational' && (
                            <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">
                              {item.paymentMethod || '-'}
                            </td>
                          )}
                          <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                            {item.description || '-'}
                          </td>
                          <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            {currency}{item.amount.toFixed(2)}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onEdit(item.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
