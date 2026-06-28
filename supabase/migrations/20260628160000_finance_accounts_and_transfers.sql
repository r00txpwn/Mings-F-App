/*
  # Finance accounts + internal transfers (Phase 1 three-account ledger)

  - finance_accounts: opening balances for cash / bank / card (singleton rows per key)
  - account_transfers: internal moves between accounts (e.g. Main bank -> Card account)
*/

CREATE TABLE IF NOT EXISTS public.finance_accounts (
  key text PRIMARY KEY CHECK (key IN ('cash', 'bank', 'card')),
  name text NOT NULL,
  opening_balance numeric(12,2) NOT NULL DEFAULT 0,
  opening_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.finance_accounts (key, name, opening_balance, opening_date)
VALUES
  ('cash', 'Cash on Hand', 0, NULL),
  ('bank', 'Main (Bank) Account', 0, CURRENT_DATE),
  ('card', 'Card Account', 0, CURRENT_DATE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.finance_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'finance_accounts'
      AND policyname = 'Anyone can read finance accounts'
  ) THEN
    CREATE POLICY "Anyone can read finance accounts"
      ON public.finance_accounts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'finance_accounts'
      AND policyname = 'Admin or manager can update finance accounts'
  ) THEN
    CREATE POLICY "Admin or manager can update finance accounts"
      ON public.finance_accounts FOR UPDATE TO authenticated
      USING (public.is_admin_or_manager())
      WITH CHECK (public.is_admin_or_manager());
  END IF;
END $$;

GRANT SELECT ON TABLE public.finance_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_accounts TO service_role;

CREATE TABLE IF NOT EXISTS public.account_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account text NOT NULL CHECK (from_account IN ('cash', 'bank', 'card')),
  to_account text NOT NULL CHECK (to_account IN ('cash', 'bank', 'card')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  fee_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_transfers_distinct_accounts CHECK (from_account <> to_account)
);

ALTER TABLE public.account_transfers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_transfers'
      AND policyname = 'Anyone can read account transfers'
  ) THEN
    CREATE POLICY "Anyone can read account transfers"
      ON public.account_transfers FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_transfers'
      AND policyname = 'Admin or manager can insert account transfers'
  ) THEN
    CREATE POLICY "Admin or manager can insert account transfers"
      ON public.account_transfers FOR INSERT TO authenticated
      WITH CHECK (public.is_admin_or_manager());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_transfers'
      AND policyname = 'Admin or manager can update account transfers'
  ) THEN
    CREATE POLICY "Admin or manager can update account transfers"
      ON public.account_transfers FOR UPDATE TO authenticated
      USING (public.is_admin_or_manager())
      WITH CHECK (public.is_admin_or_manager());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'account_transfers'
      AND policyname = 'Admins can delete account transfers'
  ) THEN
    CREATE POLICY "Admins can delete account transfers"
      ON public.account_transfers FOR DELETE TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

GRANT SELECT ON TABLE public.account_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_transfers TO service_role;

CREATE INDEX IF NOT EXISTS idx_account_transfers_date ON public.account_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_account_transfers_from ON public.account_transfers(from_account);
CREATE INDEX IF NOT EXISTS idx_account_transfers_to ON public.account_transfers(to_account);
