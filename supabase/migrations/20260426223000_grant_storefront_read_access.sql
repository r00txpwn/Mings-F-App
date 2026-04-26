GRANT SELECT ON TABLE
  public.products,
  public.master_categories,
  public.modifier_groups,
  public.modifier_options,
  public.product_modifier_groups,
  public.online_settings,
  public.delivery_zones,
  public.sales_channels
TO anon, authenticated;
