-- Scheduled slot settings for customer checkout

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'is_scheduled'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN is_scheduled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'scheduled_slot_minutes'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN scheduled_slot_minutes integer NOT NULL DEFAULT 15;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_settings' AND column_name = 'scheduled_lead_minutes'
  ) THEN
    ALTER TABLE public.online_settings ADD COLUMN scheduled_lead_minutes integer NOT NULL DEFAULT 45;
  END IF;
END $$;
