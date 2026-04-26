/*
  # Ensure public.delivery_orders exists (fresh Supabase projects)

  Historically the table could exist only in some environments. This migration
  creates the table expected by app types and wires RLS for staff only — no anon.
  Service role (Edge Functions) bypasses RLS and does not need a separate policy.
*/

CREATE TABLE IF NOT EXISTS public.delivery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales (id) ON DELETE CASCADE,
  wolt_delivery_id text,
  status text,
  tracking_url text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_sale_id ON public.delivery_orders (sale_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_wolt_delivery_id ON public.delivery_orders (wolt_delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON public.delivery_orders (status);

ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Dispatch read + staff/admin writes (same role gate as delivery_control_center SELECT policy).
-- No TO anon. Service role bypasses RLS for Edge Functions.
DROP POLICY IF EXISTS "Staff can read all delivery orders" ON public.delivery_orders;
DROP POLICY IF EXISTS "Staff can manage delivery orders" ON public.delivery_orders;

CREATE POLICY "Staff can manage delivery orders"
  ON public.delivery_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff')
    )
  );
