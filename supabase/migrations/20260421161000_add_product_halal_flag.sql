-- Product halal marker for online menu badges

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_halal'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_halal boolean NOT NULL DEFAULT false;
  END IF;
END $$;
