import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface OperationalExpense {
  id: string;
  master_category_id: string | null;
  expense_item_id: string | null;
  amount: number;
  description: string;
  expense_date: string;
  payment_method: string;
  master_categories?: { name: string; color: string };
  expense_items?: { name: string };
}

interface SaleRecord {
  id: string;
  total_price: number;
  quantity: number;
  sales_channel_id: string | null;
  notes: string;
  sale_date: string;
  sales_channels?: {
    name: string;
    icon: string;
    color: string;
    logo_url?: string | null;
  };
}

interface Purchase {
  id: string;
  product_id: string | null;
  supplier_id: string | null;
  master_category_id: string | null;
  quantity: number;
  total_cost: number;
  purchase_date: string;
  payment_status: string;
  products?: { name: string; unit?: string };
  suppliers?: { name: string };
  master_categories?: { name: string; color?: string };
}

export function MoneyScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'purchases'>('sales');
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [expensesRes, salesRes, purchasesRes] = await Promise.all([
      supabase.from('operational_expenses').select('*, master_categories(name, color), expense_items(name)').order('expense_date', { ascending: false }).limit(50),
      supabase.from('sales').select('*, sales_channels(name, icon, color, logo_url)').order('sale_date', { ascending: false }).limit(50),
      supabase.from('purchases').select('*, products(name, unit), suppliers(name), master_categories(name, color)').order('purchase_date', { ascending: false }).limit(50)
    ]);

    if (expensesRes.error) setError(expensesRes.error.message);
    if (salesRes.error) setError(salesRes.error.message);
    if (purchasesRes.error) setError(purchasesRes.error.message);

    if (expensesRes.data) setExpenses(expensesRes.data as any);
    if (salesRes.data) setSales(salesRes.data as any);
    if (purchasesRes.data) setPurchases(purchasesRes.data as any);
    setLoading(false);
  };

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_price), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalPurchases = purchases.reduce((sum, purchase) => sum + Number(purchase.total_cost), 0);
  const netProfit = totalSales - totalExpenses - totalPurchases;

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{t.money}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.trackMoney}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-lg p-3 mb-6 text-red-900 dark:text-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-100 text-sm">{t.totalSales}</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">₼{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm">{t.cogs}</span>
            <ShoppingCart className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">₼{totalPurchases.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-100 text-sm">{t.operationalExpenses}</span>
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">₼{totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`bg-gradient-to-br ${netProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-lg p-5 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">{t.netProfit}</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">₼{netProfit.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sales'
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.salesIncome}
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'purchases'
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.cogs} ({t.purchases})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'expenses'
                ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.operationalExpenses}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {activeTab === 'sales' && (
              sales.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.noSalesRecorded}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.date}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.channelName}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.orders}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.amount}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.description}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(sale.sale_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {sale.sales_channels ? (
                              <span className="flex items-center gap-2">
                                {sale.sales_channels.logo_url ? (
                                  <img src={sale.sales_channels.logo_url} alt={sale.sales_channels.name} className="w-5 h-5 object-contain" />
                                ) : (
                                  <span>{sale.sales_channels.icon}</span>
                                )}
                                <span style={{ color: sale.sales_channels.color }}>{sale.sales_channels.name}</span>
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sale.quantity || 0}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">₼{Number(sale.total_price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sale.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {activeTab === 'expenses' && (
              expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.noExpensesYet}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.date}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.masterCategory}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.expenseItem}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.amount}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.payment}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.description}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {expenses.map((expense: any) => (
                        <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(expense.expense_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {expense.master_categories?.name ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: expense.master_categories.color }} />
                                <span className="text-sm text-gray-900 dark:text-white">{expense.master_categories.name}</span>
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{expense.expense_items?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-600 dark:text-orange-400">₼{Number(expense.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{expense.payment_method || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{expense.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {activeTab === 'purchases' && (
              purchases.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t.noPurchasesRecorded}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.date}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.category}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.product}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.supplier}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.quantity}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.totalCost}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">{t.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {purchase.master_categories?.name ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: purchase.master_categories.color || '#6B7280' }} />
                                <span className="text-sm text-gray-900 dark:text-white">{purchase.master_categories.name}</span>
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{purchase.products?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{purchase.suppliers?.name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{purchase.quantity} {purchase.products?.unit || 'pcs'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">₼{Number(purchase.total_cost).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              purchase.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {purchase.payment_status === 'paid' ? t.paid : purchase.payment_status === 'partial' ? t.partial : t.pending}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
