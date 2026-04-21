/*
  Harden online payment initialization and payment data exposure:
  1) Add sales.payment_init_token for secure epoint-create-payment handoff.
  2) Enable RLS on online_payments with staff/customer read boundaries.
*/

-- 1) Secure payment initialization token on sales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales'
      AND column_name = 'payment_init_token'
  ) THEN
    ALTER TABLE public.sales
      ADD COLUMN payment_init_token text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_payment_init_token
  ON public.sales(payment_init_token)
  WHERE payment_init_token IS NOT NULL;

-- 2) online_payments RLS
ALTER TABLE public.online_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read all online payments" ON public.online_payments;
CREATE POLICY "Staff can read all online payments"
  ON public.online_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers read own online payments" ON public.online_payments;
CREATE POLICY "Customers read own online payments"
  ON public.online_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sales s
      WHERE s.id = online_payments.sale_id
        AND s.customer_user_id = auth.uid()
    )
  );
