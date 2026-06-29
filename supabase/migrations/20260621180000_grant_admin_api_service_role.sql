/*
  # Restore service_role grants for admin-api (Settings channel delete, etc.)

  Staff cockpit mutations go through the admin-api Edge Function using SUPABASE_SERVICE_ROLE_KEY.
  Without table GRANTs, Postgres returns "permission denied for table …" → HTTP 400 from admin-api.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_channels TO service_role;

GRANT SELECT, INSERT ON TABLE public.admin_audit_log TO service_role;

-- Other tables routed through admin-api (idempotent; skip if a table was renamed away).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchases TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.operational_expenses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.master_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.expense_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.suppliers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.platform_payouts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.delivery_zones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.online_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.combo_deals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.combo_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.combo_group_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_modifier_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.modifier_groups TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.modifier_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.transactions TO service_role;
