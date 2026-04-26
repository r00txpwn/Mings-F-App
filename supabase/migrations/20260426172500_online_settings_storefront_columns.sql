-- Fresh-chain compatibility: storefront code expects these original online_settings columns.
ALTER TABLE public.online_settings
  ADD COLUMN IF NOT EXISTS hours_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS min_order_amount numeric(10, 2) NOT NULL DEFAULT 0;
