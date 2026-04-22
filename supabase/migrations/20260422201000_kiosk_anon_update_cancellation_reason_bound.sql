-- Narrow anon kiosk UPDATE: still kiosk-only, but cap arbitrary writes via cancellation_reason.

DROP POLICY IF EXISTS "Anon can update kiosk order status" ON public.sales;

CREATE POLICY "Anon can update kiosk order status"
  ON public.sales FOR UPDATE
  TO anon
  USING (source = 'kiosk')
  WITH CHECK (
    source = 'kiosk'
    AND (
      cancellation_reason IS NULL
      OR (char_length(cancellation_reason) <= 2000 AND char_length(trim(cancellation_reason)) >= 1)
    )
  );
