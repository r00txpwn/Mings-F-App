-- Soft-delete sales channels instead of hard DELETE (sales + platform_payouts reference channel rows).

ALTER TABLE public.sales_channels
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sales_channels_not_deleted
  ON public.sales_channels (is_deleted)
  WHERE is_deleted = false;

COMMENT ON COLUMN public.sales_channels.is_deleted IS
  'When true, channel is hidden from Settings and channel pickers; historical sales/payouts keep FK integrity.';
