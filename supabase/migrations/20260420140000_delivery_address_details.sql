/*
  # Delivery address details

  Adds apartment + floor fields to:
    - `customer_addresses` (persists across orders for logged-in customers)
    - `sales` (copy captured at checkout, so historical orders keep the exact
      detail even if the saved address is later edited)

  The free-text `sales.delivery_notes` column already exists from
  `20260418140000_sales_prep_delivery_payment.sql` — we don't touch it here.

  Idempotent: guards every ALTER TABLE with an information_schema check so
  `supabase db push` can be re-run safely.
*/

-- ---------------------------------------------------------------------------
-- customer_addresses.{apartment, floor}
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer_addresses'
      AND column_name = 'apartment'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN apartment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'customer_addresses'
      AND column_name = 'floor'
  ) THEN
    ALTER TABLE public.customer_addresses ADD COLUMN floor text;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- sales.{delivery_apartment, delivery_floor}
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'delivery_apartment'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_apartment text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'delivery_floor'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN delivery_floor text;
  END IF;
END $$;
