-- Allow staff workflow timestamp/status fields used by Order Manager actions.
-- Keeps financial and unrelated sales columns protected from staff updates.

CREATE OR REPLACE FUNCTION public.enforce_staff_sales_workflow_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role public.user_role;
  allowed_columns constant text[] := ARRAY[
    'order_status',
    'prep_started_at',
    'estimated_ready_at',
    'ready_at',
    'dispatched_at',
    'completed_at',
    'reminder_at',
    'cancellation_reason',
    'payment_status',
    'updated_at'
  ];
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
      RAISE EXCEPTION 'Staff can only update workflow order fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
