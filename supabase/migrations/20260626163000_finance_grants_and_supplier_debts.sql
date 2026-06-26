/*
  # Finance table grants + supplier_debts ledger

  Fixes permission denied on liabilities, liability_payments, supplier_account_payments,
  bank_withdrawals (tables were created without authenticated/service_role GRANTs).

  Adds supplier_debts for dated manual debt entries per supplier.
  Migrates legacy suppliers.opening_balance into one supplier_debts row per supplier.
*/

-- Base privileges (mirror suppliers / purchases pattern)
GRANT SELECT ON TABLE public.liabilities TO authenticated;
GRANT SELECT ON TABLE public.liability_payments TO authenticated;
GRANT SELECT ON TABLE public.supplier_account_payments TO authenticated;
GRANT SELECT ON TABLE public.bank_withdrawals TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.liabilities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.liability_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_account_payments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bank_withdrawals TO service_role;

-- Manual dated debt entries per supplier
CREATE TABLE IF NOT EXISTS public.supplier_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  debt_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_debts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_debts' AND policyname = 'Anyone can read supplier debts') THEN
    CREATE POLICY "Anyone can read supplier debts"
      ON public.supplier_debts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_debts' AND policyname = 'Staff can insert supplier debts') THEN
    CREATE POLICY "Staff can insert supplier debts"
      ON public.supplier_debts FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_debts' AND policyname = 'Staff can update supplier debts') THEN
    CREATE POLICY "Staff can update supplier debts"
      ON public.supplier_debts FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'supplier_debts' AND policyname = 'Admins can delete supplier debts') THEN
    CREATE POLICY "Admins can delete supplier debts"
      ON public.supplier_debts FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

GRANT SELECT ON TABLE public.supplier_debts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.supplier_debts TO service_role;

CREATE INDEX IF NOT EXISTS idx_supplier_debts_supplier ON public.supplier_debts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_debts_date ON public.supplier_debts(debt_date);

-- One-time: move legacy opening_balance into supplier_debts
INSERT INTO public.supplier_debts (supplier_id, amount, debt_date, notes)
SELECT
  s.id,
  s.opening_balance,
  COALESCE(s.opening_balance_date, CURRENT_DATE),
  'Migrated from opening balance'
FROM public.suppliers s
WHERE COALESCE(s.opening_balance, 0) > 0
  AND NOT EXISTS (
    SELECT 1
    FROM public.supplier_debts sd
    WHERE sd.supplier_id = s.id
      AND sd.notes = 'Migrated from opening balance'
  );
