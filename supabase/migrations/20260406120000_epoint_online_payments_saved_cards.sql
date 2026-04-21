/*
  # Epoint integration — online_payments (full fields) + saved_cards + optional sales.online_payment_id

  Maps the integration plan to Ming's OS: payments link to sales.id; saved cards to auth.users.
*/

-- ---------------------------------------------------------------------------
-- 1. saved_cards (must exist before online_payments.saved_card_id FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  epoint_card_id text NOT NULL,
  card_mask text NOT NULL,
  card_name text,
  card_brand text,
  is_refund_card boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_saved_cards_user_id ON public.saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_epoint_card ON public.saved_cards(epoint_card_id)
  WHERE is_active = true;

ALTER TABLE public.saved_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers read own saved cards" ON public.saved_cards;
CREATE POLICY "Customers read own saved cards"
  ON public.saved_cards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers update own saved cards" ON public.saved_cards;
CREATE POLICY "Customers update own saved cards"
  ON public.saved_cards FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. online_payments — create base table if missing, then add Epoint columns
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.online_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'epoint',
  external_id text,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'AZN',
  status text NOT NULL DEFAULT 'pending',
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_online_payments_sale_id ON public.online_payments(sale_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'epoint_transaction'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN epoint_transaction text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'bank_transaction'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN bank_transaction text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'rrn'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN rrn text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'epoint_status'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN epoint_status text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'bank_response_code'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN bank_response_code text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'card_mask'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN card_mask text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'card_name'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN card_name text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN error_message text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN paid_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN payment_method text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'wallet_type'
  ) THEN
    ALTER TABLE public.online_payments ADD COLUMN wallet_type text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'online_payments' AND column_name = 'saved_card_id'
  ) THEN
    ALTER TABLE public.online_payments
      ADD COLUMN saved_card_id uuid REFERENCES public.saved_cards(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_online_payments_epoint_tx ON public.online_payments(epoint_transaction)
  WHERE epoint_transaction IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_online_payments_status ON public.online_payments(status);
CREATE INDEX IF NOT EXISTS idx_online_payments_external_id ON public.online_payments(external_id)
  WHERE external_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. sales.online_payment_id (nullable pointer to latest / primary payment row)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sales' AND column_name = 'online_payment_id'
  ) THEN
    ALTER TABLE public.sales
      ADD COLUMN online_payment_id uuid REFERENCES public.online_payments(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON TABLE public.online_payments IS 'Card / Epoint payment attempts for online sales; updated by Edge Functions and Epoint webhooks.';
COMMENT ON TABLE public.saved_cards IS 'Epoint card tokens for repeat pay; user_id links to auth.users.';
