-- Soft-delete flags for storefront filtering; scheduled slot must be in the future when is_scheduled is true.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_deleted'
    ) THEN
      ALTER TABLE public.products ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'combo_deals'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'combo_deals' AND column_name = 'is_deleted'
    ) THEN
      ALTER TABLE public.combo_deals ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
    END IF;
  END IF;
END $$;

DROP POLICY IF EXISTS "Anyone can read active combo deals" ON public.combo_deals;
CREATE POLICY "Anyone can read active combo deals"
  ON public.combo_deals FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_deleted = false);

CREATE OR REPLACE FUNCTION public.sales_validate_scheduled_for_future()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_scheduled, false) IS NOT TRUE OR NEW.scheduled_for IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.scheduled_for > now() THEN
    RETURN NEW;
  END IF;
  -- Past/near-now slot: allow no-op row touches (e.g. other column updates) but block new invalid writes.
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.is_scheduled, false) = COALESCE(NEW.is_scheduled, false)
     AND OLD.scheduled_for IS NOT DISTINCT FROM NEW.scheduled_for THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'scheduled_for must be in the future for scheduled orders';
END;
$$;

DROP TRIGGER IF EXISTS trg_sales_scheduled_for_future ON public.sales;
CREATE TRIGGER trg_sales_scheduled_for_future
  BEFORE INSERT OR UPDATE OF is_scheduled, scheduled_for ON public.sales
  FOR EACH ROW
  EXECUTE PROCEDURE public.sales_validate_scheduled_for_future();
