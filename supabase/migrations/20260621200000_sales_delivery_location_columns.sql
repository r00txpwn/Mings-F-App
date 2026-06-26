/*
  # Sales delivery location columns (order map + checkout)

  online-order-create and pos-order-create write delivery_lat/lng on sales.
  These columns were referenced in app code but missing from migration history
  on some environments → PostgREST error: column sales.delivery_lat does not exist.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_lat'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_lng'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_fee'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_fee numeric(12, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_zone_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_zone_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'track_token'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN track_token text;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.delivery_zones') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'sales_delivery_zone_id_fkey'
     ) THEN
    ALTER TABLE public.sales
      ADD CONSTRAINT sales_delivery_zone_id_fkey
      FOREIGN KEY (delivery_zone_id) REFERENCES public.delivery_zones(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_delivery_lat_lng
  ON public.sales (delivery_lat, delivery_lng)
  WHERE delivery_lat IS NOT NULL AND delivery_lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_delivery_map_lookup
  ON public.sales (sale_date DESC)
  WHERE delivery_lat IS NOT NULL
    AND delivery_lng IS NOT NULL
    AND order_status IS DISTINCT FROM 'cancelled';

COMMENT ON COLUMN public.sales.delivery_lat IS 'Customer delivery pin latitude (Baku checkout / POS delivery).';
COMMENT ON COLUMN public.sales.delivery_lng IS 'Customer delivery pin longitude (Baku checkout / POS delivery).';
