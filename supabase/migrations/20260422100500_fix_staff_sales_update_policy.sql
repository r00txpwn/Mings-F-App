-- Replace restrictive sales UPDATE policy so online orders with created_by NULL
-- can still be progressed by staff, while limiting staff to workflow-only fields.

DROP POLICY IF EXISTS "Staff can update own sales or admin can update any" ON public.sales;

CREATE POLICY "Staff, manager, admin can update sales"
  ON public.sales
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND role IN ('admin', 'manager', 'staff')
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_staff_sales_workflow_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role public.user_role;
  allowed_columns constant text[] := ARRAY['order_status', 'prep_started_at', 'estimated_ready_at', 'updated_at'];
BEGIN
  SELECT u.role INTO actor_role
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;

  IF actor_role = 'staff'::public.user_role THEN
    IF OLD.order_status NOT IN ('pending', 'awaiting_payment', 'preparing', 'ready', 'dispatched') THEN
      RAISE EXCEPTION 'Staff cannot update this order state';
    END IF;

    IF NEW.order_status NOT IN ('pending', 'awaiting_payment', 'preparing', 'ready', 'dispatched') THEN
      RAISE EXCEPTION 'Staff cannot set this order state';
    END IF;

    IF (to_jsonb(NEW) - allowed_columns) IS DISTINCT FROM (to_jsonb(OLD) - allowed_columns) THEN
      RAISE EXCEPTION 'Staff can only update order_status, prep_started_at, estimated_ready_at, updated_at';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_staff_sales_workflow_update ON public.sales;

CREATE TRIGGER trg_enforce_staff_sales_workflow_update
BEFORE UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.enforce_staff_sales_workflow_update();
