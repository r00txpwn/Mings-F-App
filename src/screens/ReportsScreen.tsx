import { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, Zap, Loader2, DollarSign, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface CategoryStats {
  category_name: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
}

interface ChannelStats {
  channel_name: string;
  channel_icon: string;
  channel_color: string;
  channel_logo_url?: string | null;
  total: number;
  orders: number;
  aov: number;
  percentage: number;
}

interface ActivityItem {
  id: string;
  date: string;
  type: 'sale' | 'expense' | 'purchase';
  description: string;
  amount: number;
  channel?: string;
}

export function ReportsScreen() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');

  const getDefaultDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const [totalSales, setTotalSales] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [opexCategoryStats, setOpexCategoryStats] = useState<CategoryStats[]>([]);
  const [cogsCategoryStats, setCogsCategoryStats] = useState<CategoryStats[]>([]);
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'kiosk'>('all');

  useEffect(() => {
    loadReports();
  }, [period, startDate, endDate, sourceFilter]);

  const loadReports = async () => {
    setLoading(true);

    let salesQuery = supabase
      .from('sales')
      .select('*, sales_channels(name, icon, color, logo_url)')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate + 'T23:59:59')
      .order('sale_date', { ascending: false });

    if (sourceFilter !== 'all') {
      salesQuery = salesQuery.eq('source', sourceFilter);
    }

    const [salesRes, operationalExpensesRes, purchasesRes] = await Promise.all([
      salesQuery,
      supabase
        .from('operational_expenses')
        .select('*, master_categories(name, color), expense_items(name)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate),
      supabase
        .from('purchases')
        .select('*, products(name), suppliers(name), master_categories(name, color)')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
    ]);

    const salesData = salesRes.data;
    const operationalExpensesData = operationalExpensesRes.data;
    const purchasesData = purchasesRes.data;

    if (salesData) {
      const salesTotal = salesData.reduce((sum, s: any) => sum + Number(s.total_price), 0);
      const ordersTotal = salesData.reduce((sum, s: any) => sum + Number(s.quantity || 0), 0);

      setTotalSales(salesTotal);
      setTotalOrders(ordersTotal);

      const channelBreakdown: { [key: string]: { total: number; orders: number; icon: string; color: string; logo_url?: string | null } } = {};
      salesData.forEach((s: any) => {
        const channelName = s.sales_channels?.name || 'Unknown';
        const channelIcon = s.sales_channels?.icon || '';
        const channelColor = s.sales_channels?.color || '#6b7280';
        const channelLogoUrl = s.sales_channels?.logo_url;
        if (!channelBreakdown[channelName]) {
          channelBreakdown[channelName] = { total: 0, orders: 0, icon: channelIcon, color: channelColor, logo_url: channelLogoUrl };
        }
        channelBreakdown[channelName].total += Number(s.total_price);
        channelBreakdown[channelName].orders += Number(s.quantity || 0);
      });

      setChannelStats(
        Object.entries(channelBreakdown).map(([name, data]) => ({
          channel_name: name,
          channel_icon: data.icon,
          channel_color: data.color,
          channel_logo_url: data.logo_url,
          total: data.total,
          orders: data.orders,
          aov: data.orders > 0 ? data.total / data.orders : 0,
          percentage: salesTotal > 0 ? (data.total / salesTotal) * 100 : 0,
        })).sort((a, b) => b.total - a.total)
      );
    }

    let totalOpExpenses = 0;
    if (operationalExpensesData) {
      totalOpExpenses = operationalExpensesData.reduce((sum, exp: any) => sum + Number(exp.amount), 0);
      setTotalExpenses(totalOpExpenses);

      const categoryBreakdown: { [key: string]: { total: number; count: number; color: string } } = {};
      operationalExpensesData.forEach((exp: any) => {
        const catName = exp.master_categories?.name || t.noCategory;
        const catColor = exp.master_categories?.color || '#9CA3AF';
        if (!categoryBreakdown[catName]) {
          categoryBreakdown[catName] = { total: 0, count: 0, color: catColor };
        }
        categoryBreakdown[catName].total += Number(exp.amount);
        categoryBreakdown[catName].count += 1;
      });

      setOpexCategoryStats(
        Object.entries(categoryBreakdown).map(([name, data]) => ({
          category_name: name,
          category_color: data.color,
          total: data.total,
          count: data.count,
          percentage: totalOpExpenses > 0 ? (data.total / totalOpExpenses) * 100 : 0,
        })).sort((a, b) => b.total - a.total)
      );
    } else {
      setTotalExpenses(0);
      setOpexCategoryStats([]);
    }

    if (purchasesData) {
      const purchasesTotal = purchasesData.reduce((sum, p: any) => sum + Number(p.total_cost), 0);
      setTotalPurchases(purchasesTotal);

      const cogsByCat: { [key: string]: { total: number; count: number; color: string } } = {};
      purchasesData.forEach((p: any) => {
        const catName = p.master_categories?.name || t.noCategory;
        const catColor = p.master_categories?.color || '#9CA3AF';
        if (!cogsByCat[catName]) {
          cogsByCat[catName] = { total: 0, count: 0, color: catColor };
        }
        cogsByCat[catName].total += Number(p.total_cost);
        cogsByCat[catName].count += 1;
      });

      setCogsCategoryStats(
        Object.entries(cogsByCat).map(([name, data]) => ({
          category_name: name,
          category_color: data.color,
          total: data.total,
          count: data.count,
          percentage: purchasesTotal > 0 ? (data.total / purchasesTotal) * 100 : 0,
        })).sort((a, b) => b.total - a.total)
      );
    } else {
      setTotalPurchases(0);
      setCogsCategoryStats([]);
    }

    const activity: ActivityItem[] = [];
    salesData?.forEach((s: any) => {
      activity.push({ id: s.id, date: s.sale_date, type: 'sale', description: s.sales_channels?.name || t.sales, amount: Number(s.total_price), channel: s.sales_channels?.name });
    });
    operationalExpensesData?.forEach((e: any) => {
      activity.push({ id: e.id, date: e.expense_date, type: 'expense', description: e.expense_items?.name || e.master_categories?.name || e.description || t.operationalExpenses, amount: Number(e.amount) });
    });
    purchasesData?.forEach((p: any) => {
      activity.push({ id: p.id, date: p.purchase_date, type: 'purchase', description: p.products?.name || p.master_categories?.name || t.purchases, amount: Number(p.total_cost) });
    });
    activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setActivityItems(activity.slice(0, 50));
    setLoading(false);
  };

  const netProfit = totalSales - totalPurchases - totalExpenses;
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
  const foodCostPercentage = totalSales > 0 ? (totalPurchases / totalSales) * 100 : 0;

  const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'daily') {
      const today = now.toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    } else if (newPeriod === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPeriod === 'monthly') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  const CategoryBreakdownCard = ({ title, icon, stats, color, total }: { title: string; icon: React.ReactNode; stats: CategoryStats[]; color: string; total: number }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {stats.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No data for this period</p>
      ) : (
        <div className="space-y-3">
          {stats.slice(0, 10).map((stat, idx) => (
            <div key={idx} className="rounded-xl p-4" style={{ backgroundColor: `${stat.category_color}10`, borderLeft: `4px solid ${stat.category_color}` }}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800 dark:text-white text-sm">{stat.category_name}</span>
                <span className="font-bold text-sm" style={{ color: stat.category_color }}>₼{stat.total.toFixed(2)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stat.percentage}%`, backgroundColor: stat.category_color }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                {stat.count} {t.transactions} -- {stat.percentage.toFixed(1)}%
              </p>
            </div>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-sm font-bold text-gray-800 dark:text-white">
              <span>Total</span>
              <span>₼{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="bg-orange-100 dark:bg-orange-900 p-2 sm:p-3 rounded-xl">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-700 dark:text-orange-300" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t.reports}</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg">{t.financialInsights}</p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex gap-2 sm:gap-3 lg:gap-4 mb-4 overflow-x-auto pb-2">
          {(['daily', 'weekly', 'monthly', 'custom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => p === 'custom' ? setPeriod('custom') : handlePeriodChange(p)}
              className={`px-5 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all shadow-lg whitespace-nowrap ${
                period === p
                  ? 'bg-orange-600 text-white scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95'
              }`}
            >
              {p === 'daily' ? t.daily : p === 'weekly' ? t.weekly : p === 'monthly' ? t.monthly : t.custom}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.startDate}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPeriod('custom'); }}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.endDate}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPeriod('custom'); }}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
              />
            </div>
            <div className="flex gap-2 sm:self-end w-full sm:w-auto">
              <button
                onClick={loadReports}
                className="flex-1 sm:flex-none px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                {t.confirm}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              {(['all', 'manual', 'kiosk'] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sourceFilter === src
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {src === 'all' ? t.allStatuses : src === 'manual' ? t.manual : t.kiosk}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all hover:scale-105">
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{t.totalSales}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 break-all">₼{totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-emerald-500 hover:shadow-xl transition-all hover:scale-105">
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{t.orders}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600">{totalOrders}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all hover:scale-105">
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{t.cogs}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 break-all">₼{totalPurchases.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">{foodCostPercentage.toFixed(1)}% of sales</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition-all hover:scale-105">
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{t.operationalExpenses}</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600 break-all">₼{totalExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <p className="text-gray-300 dark:text-gray-400 text-xs sm:text-sm font-medium mb-1 sm:mb-2">{t.netProfit}</p>
              <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold break-all ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ₼{netProfit.toFixed(2)}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">{profitMargin.toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6 sm:mb-8 border-2 border-blue-200 dark:border-gray-700">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              {t.netProfit}
            </h3>
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t.totalSales}</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">₼{totalSales.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-md border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t.cogs} ({t.purchases})</span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">-₼{totalPurchases.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t.foodCost}: <span className="font-bold text-blue-600 dark:text-blue-400">{foodCostPercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-xl p-5 shadow-md border-l-4 border-orange-500">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t.operationalExpenses}</span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">-₼{totalExpenses.toFixed(2)}</span>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
              <div className={`rounded-xl p-6 shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-white">{t.netProfit}</span>
                  <span className="text-3xl font-bold text-white">₼{netProfit.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex gap-6 text-white text-sm">
                  <div>
                    <span className="opacity-90">{t.profit}: </span>
                    <span className="font-bold text-lg">{profitMargin.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="opacity-90">{t.aov}: </span>
                    <span className="font-bold text-lg">₼{aov.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-blue-100 dark:bg-gray-700 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold">{t.netProfit}</span> = {t.totalSales} - {t.cogs} - {t.operationalExpenses}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              {t.salesByChannel}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channelStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="border-2 dark:border-gray-600 rounded-xl p-5 hover:shadow-lg transition-shadow"
                  style={{ borderColor: stat.channel_color }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {stat.channel_logo_url ? (
                      <img src={stat.channel_logo_url} alt={stat.channel_name} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="text-3xl">{stat.channel_icon}</div>
                    )}
                    <div>
                      <div className="font-bold text-gray-800 dark:text-white">{stat.channel_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{stat.percentage.toFixed(1)}% {t.ofSales}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.sales}</div>
                      <div className="font-bold text-lg" style={{ color: stat.channel_color }}>₼{stat.total.toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.orders}</div>
                      <div className="font-bold text-lg text-gray-700 dark:text-gray-200">{stat.orders}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.aov}</div>
                      <div className="font-bold text-lg text-gray-700 dark:text-gray-200">₼{stat.aov.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <CategoryBreakdownCard
              title={`${t.cogs} ${t.categoryBreakdown}`}
              icon={<ShoppingCart className="w-6 h-6 text-blue-600" />}
              stats={cogsCategoryStats}
              color="blue"
              total={totalPurchases}
            />
            <CategoryBreakdownCard
              title={`${t.operationalExpenses} ${t.categoryBreakdown}`}
              icon={<DollarSign className="w-6 h-6 text-orange-600" />}
              stats={opexCategoryStats}
              color="orange"
              total={totalExpenses}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              {t.transactionHistory}
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm whitespace-nowrap">{t.date}</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm whitespace-nowrap">{t.type}</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm whitespace-nowrap">{t.description}</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-bold text-gray-700 dark:text-gray-200 text-xs sm:text-sm whitespace-nowrap">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityItems.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
                          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            item.type === 'sale'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : item.type === 'purchase'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {item.type === 'sale' ? t.sales : item.type === 'purchase' ? t.cogs : t.expense}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          {item.description}
                        </td>
                        <td className={`py-2 sm:py-3 px-2 sm:px-4 text-right font-bold text-xs sm:text-sm whitespace-nowrap ${
                          item.type === 'sale' ? 'text-green-600 dark:text-green-400' : item.type === 'purchase' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {item.type === 'sale' ? '+' : '-'}₼{item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
