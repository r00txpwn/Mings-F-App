-- wolt-drive-manual-dispatch upserts delivery_orders by sale_id; one row per sale required.

CREATE UNIQUE INDEX IF NOT EXISTS delivery_orders_sale_id_unique
  ON public.delivery_orders (sale_id);
