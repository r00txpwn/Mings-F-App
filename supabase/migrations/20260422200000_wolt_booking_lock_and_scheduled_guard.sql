-- Persisted Wolt "book portal" lock for multi-staff / multi-tab coordination (see wolt-dispatch-book-lock edge function).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'delivery_orders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'delivery_orders' AND column_name = 'wolt_booking_locked_until'
    ) THEN
      ALTER TABLE public.delivery_orders ADD COLUMN wolt_booking_locked_until timestamptz;
    END IF;
  END IF;
END $$;
