import assert from 'node:assert/strict';
import { computeRevenueRunRate, parseAgentCapabilities } from './runRate.mjs';

const caps = parseAgentCapabilities(' sales_read,EXPENSES_RW ,bogus ');
assert.deepEqual([...caps].sort(), ['expenses_rw', 'sales_read']);

const jan = computeRevenueRunRate(3100, '2026-01-10');
assert.equal(jan.days_elapsed, 10);
assert.equal(jan.days_in_month, 31);
assert.equal(jan.daily_average, 310);
assert.equal(jan.projected_month_revenue, 9610);

const feb = computeRevenueRunRate(1400, '2026-02-07');
assert.equal(feb.days_in_month, 28);
assert.equal(feb.projected_month_revenue, 5600);

console.log('mings-ops selfcheck: ok');
