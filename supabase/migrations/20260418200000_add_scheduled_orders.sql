-- Scheduled order support for Order Manager workflow

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN scheduled_for timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'reminder_at'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN reminder_at timestamptz;
  END IF;
END $$;
