/** Pure helpers + capability parse (keep in sync with agentAuth.ts). */

export function daysInMonth(year, monthIndex0) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function computeRevenueRunRate(mtdRevenue, asOfYmd) {
  const [y, m, d] = asOfYmd.split('-').map((x) => Number(x));
  const daysElapsed = Math.max(1, d);
  const dim = daysInMonth(y, m - 1);
  const dailyAverage = mtdRevenue / daysElapsed;
  return {
    as_of: asOfYmd,
    month: `${y}-${String(m).padStart(2, '0')}`,
    days_elapsed: daysElapsed,
    days_in_month: dim,
    mtd_revenue: mtdRevenue,
    projected_month_revenue: dailyAverage * dim,
    daily_average: dailyAverage,
  };
}

const ALLOWED = new Set([
  'sales_read',
  'analytics_read',
  'expenses_read',
  'expenses_write',
  'expenses_delete',
]);

const LEGACY = {
  expenses_rw: ['expenses_read', 'expenses_write'],
};

export function parseAgentCapabilities(raw) {
  const out = new Set();
  if (!raw || !String(raw).trim()) return out;
  for (const part of String(raw).split(',')) {
    const token = part.trim().toLowerCase();
    if (ALLOWED.has(token)) {
      out.add(token);
      continue;
    }
    const aliased = LEGACY[token];
    if (aliased) {
      for (const cap of aliased) out.add(cap);
    }
  }
  return out;
}
