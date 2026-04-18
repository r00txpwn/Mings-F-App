-- Add explicit combo upsell mapping per product

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'upsell_combo_id'
  ) THEN
    ALTER TABLE public.products
      ADD COLUMN upsell_combo_id uuid REFERENCES public.combo_deals(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_upsell_combo_id
  ON public.products(upsell_combo_id);
