-- Prep time, courier notes, online payment method (cod | epoint), delivery_orders.manual_dispatch flag

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'estimated_ready_at'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN estimated_ready_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'delivery_notes'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_notes text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'online_payment_method'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN online_payment_method text;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'delivery_orders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'delivery_orders' AND column_name = 'manually_dispatched'
    ) THEN
      ALTER TABLE public.delivery_orders ADD COLUMN manually_dispatched boolean DEFAULT false NOT NULL;
    END IF;
  END IF;
END $$;
