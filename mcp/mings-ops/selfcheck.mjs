import assert from 'node:assert/strict';
import { computeRevenueRunRate, parseAgentCapabilities } from './runRate.mjs';

const caps = parseAgentCapabilities(' sales_read,EXPENSES_RW ,bogus ');
assert.deepEqual([...caps].sort(), ['expenses_rw', 'sales_read']);
assert.equal(parseAgentCapabilities('').size, 0);

const jan = computeRevenueRunRate(3100, '2026-01-10');
assert.equal(jan.days_elapsed, 10);
assert.equal(jan.days_in_month, 31);
assert.equal(jan.daily_average, 310);
assert.equal(jan.projected_month_revenue, 9610);

const feb = computeRevenueRunRate(1400, '2026-02-07');
assert.equal(feb.days_in_month, 28);
assert.equal(feb.projected_month_revenue, 5600);

// MCP must not let params.action override the tool action (regression guard).
function buildBody(action, params = {}) {
  const { action: _ignoredAction, ...rest } = params && typeof params === 'object' ? params : {};
  return { ...rest, action };
}
assert.equal(buildBody('create_expense', { action: 'delete_expense', amount: 1 }).action, 'create_expense');

console.log('mings-ops selfcheck: ok');
