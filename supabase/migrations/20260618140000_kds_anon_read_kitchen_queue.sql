-- KDS (/kds) reads sales with the anon Supabase client (no staff JWT).
-- Prior policy only allowed anon SELECT where source = 'kiosk', so online_takeaway /
-- online_delivery orders were invisible on the kitchen board after the split deploy.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'Anon can read kitchen queue sales'
  ) THEN
    CREATE POLICY "Anon can read kitchen queue sales"
      ON public.sales FOR SELECT
      TO anon
      USING (
        source IN ('kiosk', 'online_delivery', 'online_takeaway')
        AND order_status IN ('pending', 'preparing', 'ready')
      );
  END IF;
END $$;
