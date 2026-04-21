-- Kitchen/store anchor coordinates for distance and ETA calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND column_name = 'kitchen_lat'
  ) THEN
    ALTER TABLE public.online_settings
      ADD COLUMN kitchen_lat double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'online_settings'
      AND column_name = 'kitchen_lng'
  ) THEN
    ALTER TABLE public.online_settings
      ADD COLUMN kitchen_lng double precision;
  END IF;
END $$;

-- Seed defaults for existing rows to preserve current behavior
UPDATE public.online_settings
SET
  kitchen_lat = COALESCE(kitchen_lat, 40.3777),
  kitchen_lng = COALESCE(kitchen_lng, 49.892);
