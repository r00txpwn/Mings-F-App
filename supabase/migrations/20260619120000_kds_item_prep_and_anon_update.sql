-- KDS item prep checkoffs: prepared_at on sale_items + anon UPDATE on kitchen queue.

ALTER TABLE public.sale_items
  ADD COLUMN IF NOT EXISTS prepared_at timestamptz;

COMMENT ON COLUMN public.sale_items.prepared_at IS
  'When kitchen marked this line prepared on KDS; NULL = not yet prepared.';

-- Restrict anon updates to kitchen-queue sales only (edge function is primary path).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'sale_items' AND policyname = 'Anon can update sale item prep on kitchen queue'
  ) THEN
    CREATE POLICY "Anon can update sale item prep on kitchen queue"
      ON public.sale_items FOR UPDATE
      TO anon
      USING (
        EXISTS (
          SELECT 1 FROM public.sales s
          WHERE s.id = sale_items.sale_id
            AND s.source IN ('kiosk', 'online_delivery', 'online_takeaway')
            AND s.order_status IN ('pending', 'preparing', 'ready')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.sales s
          WHERE s.id = sale_items.sale_id
            AND s.source IN ('kiosk', 'online_delivery', 'online_takeaway')
            AND s.order_status IN ('pending', 'preparing', 'ready')
        )
      );
  END IF;
END $$;

-- Guard: anon may only change prepared_at (not prices, qty, etc.)
CREATE OR REPLACE FUNCTION public.kds_sale_items_prepared_at_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'anon' THEN
    RETURN NEW;
  END IF;

  IF NEW.sale_id IS DISTINCT FROM OLD.sale_id
    OR NEW.product_id IS DISTINCT FROM OLD.product_id
    OR NEW.product_name IS DISTINCT FROM OLD.product_name
    OR NEW.quantity IS DISTINCT FROM OLD.quantity
    OR NEW.unit_price IS DISTINCT FROM OLD.unit_price
    OR NEW.total_price IS DISTINCT FROM OLD.total_price
    OR NEW.notes IS DISTINCT FROM OLD.notes
    OR NEW.is_combo IS DISTINCT FROM OLD.is_combo
    OR NEW.combo_id IS DISTINCT FROM OLD.combo_id
    OR NEW.combo_selections IS DISTINCT FROM OLD.combo_selections
  THEN
    RAISE EXCEPTION 'KDS anon may only update prepared_at on sale_items';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS kds_sale_items_prepared_at_guard ON public.sale_items;
CREATE TRIGGER kds_sale_items_prepared_at_guard
  BEFORE UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.kds_sale_items_prepared_at_guard();
