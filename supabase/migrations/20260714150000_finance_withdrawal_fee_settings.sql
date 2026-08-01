/*
  # Finance withdrawal fee settings (bank / card cash-out commissions)

  Singleton row of editable rates for:
    - bank (cashier withdrawals): default 0.5%, min ₼0
    - card (ABB ATM withdrawals): default 1%, min ₼1

  Historical bank_withdrawals.fee_amount snapshots are never recomputed when
  these settings change — new rates apply only to new withdrawals.
*/

CREATE TABLE IF NOT EXISTS public.finance_withdrawal_fee_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  bank_rate numeric(6, 4) NOT NULL DEFAULT 0.005
    CHECK (bank_rate >= 0 AND bank_rate <= 0.10),
  bank_min_fee numeric(12, 3) NOT NULL DEFAULT 0
    CHECK (bank_min_fee >= 0),
  card_rate numeric(6, 4) NOT NULL DEFAULT 0.01
    CHECK (card_rate >= 0 AND card_rate <= 0.10),
  card_min_fee numeric(12, 3) NOT NULL DEFAULT 1
    CHECK (card_min_fee >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.finance_withdrawal_fee_settings (id, bank_rate, bank_min_fee, card_rate, card_min_fee)
VALUES (1, 0.005, 0, 0.01, 1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.finance_withdrawal_fee_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_withdrawal_fee_settings'
      AND policyname = 'Authenticated can read withdrawal fee settings'
  ) THEN
    CREATE POLICY "Authenticated can read withdrawal fee settings"
      ON public.finance_withdrawal_fee_settings
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

GRANT SELECT ON TABLE public.finance_withdrawal_fee_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_withdrawal_fee_settings TO service_role;

COMMENT ON TABLE public.finance_withdrawal_fee_settings IS
  'Singleton: bank (cashier) and card (ATM) withdrawal commission rates. Snapshotted onto bank_withdrawals at insert time.';
