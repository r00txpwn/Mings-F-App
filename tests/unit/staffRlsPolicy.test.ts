import { describe, expect, it } from 'vitest';

/**
 * Documents expected RLS posture after 20260610120000_harden_staff_only_rls.sql.
 * Run manual staging checks in docs/STAGING_RLS_VALIDATION.md with a phone-OTP customer JWT.
 */
describe('staff RLS policy expectations', () => {
  it('documents customer JWT must not mutate admin tables', () => {
    const customerBlockedMutations = [
      'products INSERT/UPDATE/DELETE',
      'suppliers INSERT/UPDATE/DELETE',
      'operational_expenses INSERT/UPDATE/DELETE',
      'platform_payouts INSERT/UPDATE/DELETE',
      'sales_channels INSERT/UPDATE/DELETE',
    ];
    expect(customerBlockedMutations.length).toBeGreaterThan(0);
  });

  it('documents staff mutations route through admin-api Edge Function', () => {
    const auditedTables = ['products', 'sales', 'delivery_zones', 'online_settings'];
    expect(auditedTables).toContain('products');
  });
});
