import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, ShoppingCart, TrendingUp as ChartIcon, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase, SalesChannel } from '../lib/supabase';
import { PieChart } from '../components/PieChart';
import { LineChart } from '../components/LineChart';

interface ChannelSales {
  channel_id: string;
  channel_name: string;
  channel_icon: string;
  channel_color: string;
  channel_logo_url?: string | null;
  display_order: number;
  total_sales: number;
  order_count: number;
}

type TimePeriod = 'today' | 'week' | 'month' | 'custom';

interface ExpenseCategoryData {
  category_id: string;
  category_name: string;
  category_color: string;
  total_amount: number;
}

interface DailyChannelRevenue {
  date: string;
  channel_id: string;
  total_revenue: number;
}

export function HomeScreen() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<TimePeriod>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sales, setSales] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [orders, setOrders] = useState(0);
  const [purchaseCosts, setPurchaseCosts] = useState(0);
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelSales[]>([]);
  const [allChannels, setAllChannels] = useState<SalesChannel[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryData[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyChannelRevenue[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (allChannels.length > 0) {
      loadStats();
      loadDailyRevenue();
    }
  }, [period, customStartDate, customEndDate, allChannels]);

  const loadChannels = async () => {
    const { data } = await supabase
      .from('sales_channels')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data) {
      setAllChannels(data);
      setSelectedChannels(new Set(data.map(c => c.id)));
    }
  };

  const getDateRange = (): { startDate: string; endDate: string } => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (period === 'today') {
      return { startDate: todayStr, endDate: todayStr };
    }

    if (period === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo.toISOString().split('T')[0], endDate: todayStr };
    }

    if (period === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: firstDayOfMonth.toISOString().split('T')[0], endDate: todayStr };
    }

    return {
      startDate: customStartDate || todayStr,
      endDate: customEndDate || todayStr
    };
  };

  const loadDailyRevenue = async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const { data: salesData } = await supabase
      .from('sales')
      .select('sale_date, sales_channel_id, total_price')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate + 'T23:59:59')
      .order('sale_date', { ascending: true });

    if (!salesData) return;

    const dailyMap = new Map<string, Map<string, number>>();

    salesData.forEach((sale: any) => {
      const date = sale.sale_date.split('T')[0];
      const channelId = sale.sales_channel_id || 'none';

      if (!dailyMap.has(date)) {
        dailyMap.set(date, new Map());
      }

      const dateMap = dailyMap.get(date)!;
      const current = dateMap.get(channelId) || 0;
      dateMap.set(channelId, current + Number(sale.total_price));
    });

    const result: DailyChannelRevenue[] = [];
    dailyMap.forEach((channelMap, date) => {
      channelMap.forEach((revenue, channelId) => {
        result.push({ date, channel_id: channelId, total_revenue: revenue });
      });
    });

    setDailyRevenue(result);
  };

  const loadStats = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();

    const [salesRes, operationalExpensesRes, purchasesRes] = await Promise.all([
      supabase
        .from('sales')
        .select('total_price, quantity, sales_channel_id')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate + 'T23:59:59'),
      supabase
        .from('operational_expenses')
        .select('amount, category_id, categories(id, name, color)')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate),
      supabase
        .from('purchases')
        .select('total_cost')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate),
    ]);

    const salesData = salesRes.data;
    const operationalExpensesData = operationalExpensesRes.data;
    const purchasesData = purchasesRes.data;

    const totalSales = salesData?.reduce((sum, s: any) => sum + Number(s.total_price), 0) || 0;
    const totalOrders = salesData?.reduce((sum, s: any) => sum + Number(s.quantity || 0), 0) || 0;
    const totalPurchases = purchasesData?.reduce((sum, p: any) => sum + Number(p.total_cost), 0) || 0;
    const totalExpenses = operationalExpensesData?.reduce((sum, e: any) => sum + Number(e.amount), 0) || 0;

    setSales(totalSales);
    setOrders(totalOrders);
    setExpenses(totalExpenses);
    setPurchaseCosts(totalPurchases);

    const channelMap = new Map<string, ChannelSales>();

    allChannels.forEach((channel) => {
      channelMap.set(channel.id, {
        channel_id: channel.id,
        channel_name: channel.name,
        channel_icon: channel.icon,
        channel_color: channel.color,
        channel_logo_url: channel.logo_url,
        display_order: channel.display_order || 999,
        total_sales: 0,
        order_count: 0,
      });
    });

    salesData?.forEach((sale: any) => {
      const channelId = sale.sales_channel_id;
      if (channelId && channelMap.has(channelId)) {
        const channel = channelMap.get(channelId)!;
        channel.total_sales += Number(sale.total_price);
        channel.order_count += Number(sale.quantity || 0);
      }
    });

    const breakdown = Array.from(channelMap.values()).sort((a, b) => a.display_order - b.display_order);
    setChannelBreakdown(breakdown);

    const categoryMap = new Map<string, ExpenseCategoryData>();

    operationalExpensesData?.forEach((expense: any) => {
      if (expense.categories) {
        const catId = expense.categories.id;
        const catName = expense.categories.name;
        const catColor = expense.categories.color || '#6B7280';

        if (categoryMap.has(catId)) {
          categoryMap.get(catId)!.total_amount += Number(expense.amount);
        } else {
          categoryMap.set(catId, {
            category_id: catId,
            category_name: catName,
            category_color: catColor,
            total_amount: Number(expense.amount)
          });
        }
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    setExpenseCategories(categoryBreakdown);
    setLoading(false);
  };

  const balance = sales - expenses - purchaseCosts;
  const aov = orders > 0 ? sales / orders : 0;
  const foodCostPercentage = sales > 0 ? (purchaseCosts / sales) * 100 : 0;

  const getPeriodLabel = () => {
    if (period === 'today') return t.today;
    if (period === 'week') return t.week;
    if (period === 'month') {
      const today = new Date();
      return `${t.month} (${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')})`;
    }
    if (period === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} - ${customEndDate}`;
    }
    return t.custom;
  };

  const getPeriodPrefix = () => {
    if (period === 'today') return t.today;
    if (period === 'week') return t.week;
    if (period === 'month') return t.month;
    return t.custom;
  };

  const toggleChannel = (channelId: string) => {
    const newSelected = new Set(selectedChannels);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelectedChannels(newSelected);
  };

  const getChartData = () => {
    return allChannels
      .filter(channel => selectedChannels.has(channel.id))
      .map(channel => {
        const channelData = dailyRevenue
          .filter(d => d.channel_id === channel.id)
          .map(d => ({ date: d.date, value: d.total_revenue }));

        return {
          label: channel.name,
          color: channel.color,
          data: channelData,
        };
      });
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{t.home}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.overview}</p>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">{t.period}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'today'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.today}
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.week}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.month}
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === 'custom'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t.custom}
          </button>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.startDate}</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t.endDate}</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-900 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {getPeriodLabel()}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{getPeriodPrefix()} {t.sales}</p>
              </div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">₼{sales.toFixed(2)}</p>
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                {orders} {t.orders} &bull; ₼{aov.toFixed(2)} {t.aov}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{getPeriodPrefix()} {t.operationalExpenses}</p>
              </div>
              <p className="text-3xl font-semibold text-gray-900 dark:text-white">₼{expenses.toFixed(2)}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.netProfit}</p>
              </div>
              <p className={`text-3xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₼{balance.toFixed(2)}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{t.foodCost}</p>
              </div>
              <p className={`text-3xl font-semibold mb-3 ${foodCostPercentage > 28 ? 'text-red-600' : foodCostPercentage >= 22 ? 'text-yellow-600' : 'text-green-600'}`}>
                {foodCostPercentage.toFixed(1)}%
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                ₼{purchaseCosts.toFixed(2)} {t.cogs}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <ChartIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t.salesByChannel}</h2>
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3">{t.salesChannels}:</p>
              <div className="flex flex-wrap gap-2">
                {allChannels.map((channel) => {
                  const isSelected = selectedChannels.has(channel.id);
                  return (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-gray-900 text-white dark:bg-gray-700 shadow-sm'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 opacity-50 hover:opacity-75'
                      }`}
                      style={isSelected ? { backgroundColor: channel.color, color: 'white' } : {}}
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: channel.color }}
                      />
                      {channel.logo_url ? (
                        <img src={channel.logo_url} alt={channel.name} className="h-4 w-4 object-contain" />
                      ) : (
                        <span>{channel.icon}</span>
                      )}
                      <span>{channel.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <LineChart series={getChartData()} height={350} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.salesByChannel}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {channelBreakdown.map((channel) => (
                  <div
                    key={channel.channel_id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {channel.channel_logo_url ? (
                        <img src={channel.channel_logo_url} alt={channel.channel_name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-2xl">{channel.channel_icon}</span>
                      )}
                      <h3 className="font-medium text-gray-900 dark:text-white">{channel.channel_name}</h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t.sales}</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">
                          ₼{channel.total_sales.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {channel.order_count} {t.orders}
                        {channel.order_count > 0 && (
                          <span> &bull; ₼{(channel.total_sales / channel.order_count).toFixed(2)} {t.aov}</span>
                        )}
                      </div>
                      {sales > 0 && (
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          {((channel.total_sales / sales) * 100).toFixed(1)}% {t.share}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.categoryBreakdown}</h2>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <PieChart
                  data={expenseCategories.map(cat => ({
                    label: cat.category_name,
                    value: cat.total_amount,
                    color: cat.category_color
                  }))}
                  size={240}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
