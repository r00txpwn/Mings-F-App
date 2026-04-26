GRANT SELECT ON TABLE public.users TO authenticated;

GRANT SELECT ON TABLE
  public.sales,
  public.operational_expenses,
  public.purchases,
  public.platform_payouts,
  public.expense_items,
  public.sale_items,
  public.sale_item_modifiers
TO authenticated;
