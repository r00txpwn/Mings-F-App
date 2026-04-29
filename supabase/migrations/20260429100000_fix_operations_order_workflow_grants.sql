/*
  # Restore operations order workflow grants

  RLS policies already constrain what anon kiosk/KDS clients and authenticated
  staff can do. PostgREST still requires table-level privileges before RLS is
  evaluated, otherwise operational flows fail with:

    permission denied for table sales

  This migration restores the minimum table privileges needed by:
  - /kiosk direct kiosk sale creation
  - /kds order reads with nested line items
  - /order-manager staff workflow updates
*/

GRANT SELECT, INSERT ON TABLE public.sales TO anon;
GRANT SELECT, INSERT ON TABLE public.sale_items TO anon;
GRANT SELECT, INSERT ON TABLE public.sale_item_modifiers TO anon;

GRANT SELECT, UPDATE ON TABLE public.sales TO authenticated;
GRANT SELECT ON TABLE public.sale_items TO authenticated;
GRANT SELECT ON TABLE public.sale_item_modifiers TO authenticated;
