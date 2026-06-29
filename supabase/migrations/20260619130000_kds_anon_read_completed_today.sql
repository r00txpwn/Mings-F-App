-- KDS history drawer: anon read completed kitchen orders from today (Asia/Baku).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sales' AND policyname = 'Anon can read completed kitchen sales today'
  ) THEN
    CREATE POLICY "Anon can read completed kitchen sales today"
      ON public.sales FOR SELECT
      TO anon
      USING (
        source IN ('kiosk', 'online_delivery', 'online_takeaway')
        AND order_status = 'completed'
        AND ready_at IS NOT NULL
        AND ready_at >= (
          date_trunc('day', timezone('Asia/Baku', now())) AT TIME ZONE 'Asia/Baku'
        )
      );
  END IF;
END $$;

-- Completed sale line items for history drawer (same parent sale visibility).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sale_items' AND policyname = 'Anon can read sale items for completed kitchen sales today'
  ) THEN
    CREATE POLICY "Anon can read sale items for completed kitchen sales today"
      ON public.sale_items FOR SELECT
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM public.sales s
          WHERE s.id = sale_items.sale_id
            AND s.source IN ('kiosk', 'online_delivery', 'online_takeaway')
            AND s.order_status = 'completed'
            AND s.ready_at IS NOT NULL
            AND s.ready_at >= (
              date_trunc('day', timezone('Asia/Baku', now())) AT TIME ZONE 'Asia/Baku'
            )
        )
      );
  END IF;
END $$;
