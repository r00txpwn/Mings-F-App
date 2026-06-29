/*
  # Sales completion / dispatch timestamps (X-BUG-06)

  Staff workflow code (Order Support, Order Manager) stamps `completed_at` and
  `dispatched_at` when an order is completed or dispatched, and the staff-workflow
  RLS triggers already whitelist these columns
  (20260422103000_expand_staff_workflow_update_columns.sql,
   20260422104500_allow_staff_complete_orders.sql).

  However the columns were never actually added to `public.sales`, so completing /
  dispatching an order failed with:
    PostgREST error: column sales.completed_at does not exist

  This migration is purely additive (nullable timestamptz) and idempotent.
*/

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.sales.dispatched_at IS 'When the order was handed to a rider / marked out for delivery (staff workflow).';
COMMENT ON COLUMN public.sales.completed_at IS 'When the order reached a terminal completed/delivered state (staff workflow).';

CREATE INDEX IF NOT EXISTS idx_sales_completed_at
  ON public.sales (completed_at)
  WHERE completed_at IS NOT NULL;
