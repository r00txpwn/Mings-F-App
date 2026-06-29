/*
  # Cash drawer / reconciliation ledger

  Enables a running physical-cash balance for month-end reconciliation.

  1. sales: capture how an order was paid (cash vs card) and when cash was
     collected, so cash-in can be derived from paid cash orders.
       - payment_method text  (e.g. 'cash', 'card'; null = unknown/legacy)
       - paid_at timestamptz  (stamped when payment_status becomes 'paid')

  2. cash_movements: ledger for cash events that have no other home —
     opening float, bank deposits (cash -> bank), and manual adjustments.
     Cash-in (paid cash orders) and cash-out (cash expenses / supplier /
     liability payments) are DERIVED from their existing tables, so this
     table intentionally does NOT duplicate them.
*/

-- 1. Sales payment capture ---------------------------------------------------
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sales_paid_at ON public.sales(paid_at);

-- 2. Cash movements ledger ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  category text NOT NULL CHECK (category IN ('opening_float', 'bank_deposit', 'adjustment', 'other')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_movements' AND policyname = 'Anyone can read cash movements') THEN
    CREATE POLICY "Anyone can read cash movements"
      ON public.cash_movements FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_movements' AND policyname = 'Staff can insert cash movements') THEN
    CREATE POLICY "Staff can insert cash movements"
      ON public.cash_movements FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_movements' AND policyname = 'Staff can update cash movements') THEN
    CREATE POLICY "Staff can update cash movements"
      ON public.cash_movements FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'cash_movements' AND policyname = 'Admins can delete cash movements') THEN
    CREATE POLICY "Admins can delete cash movements"
      ON public.cash_movements FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

GRANT SELECT ON TABLE public.cash_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_movements TO service_role;

CREATE INDEX IF NOT EXISTS idx_cash_movements_date ON public.cash_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_cash_movements_category ON public.cash_movements(category);
