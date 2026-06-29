/*
  KDS now requires staff Supabase Auth (same as POS / order-manager).
  Remove anon read/write policies that exposed kitchen queue data without login.
*/

DROP POLICY IF EXISTS "Anon can read kitchen queue sales" ON public.sales;
DROP POLICY IF EXISTS "Anon can read completed kitchen sales today" ON public.sales;
DROP POLICY IF EXISTS "Anon can update sale item prep on kitchen queue" ON public.sale_items;
DROP POLICY IF EXISTS "Anon can read sale items for completed kitchen sales today" ON public.sale_items;

DROP TRIGGER IF EXISTS kds_sale_items_prepared_at_guard ON public.sale_items;
DROP FUNCTION IF EXISTS public.kds_sale_items_prepared_at_guard();
