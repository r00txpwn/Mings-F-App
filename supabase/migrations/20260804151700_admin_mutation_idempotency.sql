/*
  Admin mutation idempotency (belt-and-suspenders for money writes).

  - admin_mutation_idempotency: caches successful responses per staff actor + key
  - client_request_id on high-risk insert tables: UNIQUE so a retried POST cannot
    create a second row when the first write already landed but the client saw
    Failed to fetch.
*/

CREATE TABLE IF NOT EXISTS public.admin_mutation_idempotency (
  actor_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  resource_table text NOT NULL,
  resource_id text,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor_id, idempotency_key)
);

COMMENT ON TABLE public.admin_mutation_idempotency IS
  'Service-role only. Stores successful admin-api mutation responses for safe client replay.';

ALTER TABLE public.admin_mutation_idempotency ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_mutation_idempotency FROM PUBLIC;
REVOKE ALL ON TABLE public.admin_mutation_idempotency FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_mutation_idempotency TO service_role;

-- Money / ledger inserts: unique client_request_id (nullable for legacy rows)
ALTER TABLE public.supplier_account_payments
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

ALTER TABLE public.liability_payments
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

ALTER TABLE public.bank_withdrawals
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

ALTER TABLE public.account_transfers
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

ALTER TABLE public.salary_payments
  ADD COLUMN IF NOT EXISTS client_request_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS supplier_account_payments_client_request_id_uidx
  ON public.supplier_account_payments (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS liability_payments_client_request_id_uidx
  ON public.liability_payments (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bank_withdrawals_client_request_id_uidx
  ON public.bank_withdrawals (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS cash_movements_client_request_id_uidx
  ON public.cash_movements (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS account_transfers_client_request_id_uidx
  ON public.account_transfers (client_request_id)
  WHERE client_request_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS salary_payments_client_request_id_uidx
  ON public.salary_payments (client_request_id)
  WHERE client_request_id IS NOT NULL;
