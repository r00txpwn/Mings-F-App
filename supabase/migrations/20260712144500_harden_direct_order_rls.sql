/*
  Remove direct customer/kiosk database writes after Edge Function paths are verified.
  Apply only after sandbox QA passes for online-order-create + kiosk-order-create.
*/

BEGIN;

-- sale_items: remove public insert + world-readable select
DROP POLICY IF EXISTS "Authenticated users can insert sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Anon can insert kiosk sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Anyone can read sale items" ON public.sale_items;

CREATE POLICY "Staff can view sale items"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (public.is_staff_user());

CREATE POLICY "Customers can view own sale items"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND s.customer_user_id = auth.uid()
    )
  );

-- sales: remove anon kiosk insert (orders go through kiosk-order-create)
DROP POLICY IF EXISTS "Anon can insert kiosk sales" ON public.sales;

-- sale_item_modifiers: remove anon kiosk insert
DROP POLICY IF EXISTS "Anon users can insert sale item modifiers for kiosk orders" ON public.sale_item_modifiers;

-- Direct order number allocators: service_role only
REVOKE EXECUTE ON FUNCTION public.allocate_direct_display_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_daily_order_number() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_daily_order_number_for_source(text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.allocate_direct_display_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_daily_order_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_daily_order_number_for_source(text) TO service_role;

COMMIT;
