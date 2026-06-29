/*
  # Grant staff read access to suppliers

  Money / Expenses / Products screens join purchases → suppliers(name).
  RLS "Staff can view suppliers" was added in 20260610120000_harden_staff_only_rls.sql
  but GRANT SELECT on public.suppliers for authenticated was never applied
  (unlike products, purchases, operational_expenses in 20260426224500).

  PostgREST then returns: permission denied for table suppliers
*/

GRANT SELECT ON TABLE public.suppliers TO authenticated;

-- Remove legacy open-read policies superseded by staff-only SELECT
DROP POLICY IF EXISTS "Anyone can read suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anonymous read access to suppliers" ON public.suppliers;

DROP POLICY IF EXISTS "Staff can view suppliers" ON public.suppliers;
CREATE POLICY "Staff can view suppliers"
  ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_staff_user());
