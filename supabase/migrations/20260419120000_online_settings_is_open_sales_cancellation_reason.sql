-- Customer-facing storefront: kitchen open flag + staff cancellation reason for tracking.

ALTER TABLE public.online_settings
  ADD COLUMN IF NOT EXISTS is_open boolean DEFAULT true;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

COMMENT ON COLUMN public.online_settings.is_open IS 'When false, /order checkout should block new orders (kitchen closed).';
COMMENT ON COLUMN public.sales.cancellation_reason IS 'Optional staff-facing reason surfaced to customer on /track when order is cancelled.';
