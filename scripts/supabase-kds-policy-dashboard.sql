-- KDS fix only — run in Supabase Dashboard → SQL Editor if CLI push is blocked.
-- Allows anon /kds to read online_takeaway + online_delivery orders in kitchen queue.

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

-- After running, also record migration in history (optional, for CLI sync later):
-- INSERT INTO supabase_migrations.schema_migrations (version)
-- VALUES ('20260618140000') ON CONFLICT (version) DO NOTHING;
