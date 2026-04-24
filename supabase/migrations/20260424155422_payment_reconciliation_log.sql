/*
  # Payment reconciliation audit log (foundation only)

  Append-only style log for future reconcilers and (optionally) webhooks.
  No triggers or cron — table + indexes + RLS shell only.
*/

CREATE TABLE IF NOT EXISTS public.payment_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  online_payment_id uuid REFERENCES public.online_payments(id) ON DELETE SET NULL,
  provider text NOT NULL,
  reconcile_trigger text NOT NULL,
  candidate_reason text,
  action text NOT NULL,
  before_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider_response jsonb,
  error_message text
);

COMMENT ON TABLE public.payment_reconciliation_log IS
  'Audit trail for payment reconciliation: provider-agnostic; populated by edge jobs / webhooks when wired.';

COMMENT ON COLUMN public.payment_reconciliation_log.reconcile_trigger IS
  'What initiated the check (e.g. epoint_webhook_signed, scheduled_reconcile).';

COMMENT ON COLUMN public.payment_reconciliation_log.candidate_reason IS
  'Why this sale/payment was considered for a mutation (e.g. status_mismatch, stale_pending).';

COMMENT ON COLUMN public.payment_reconciliation_log.action IS
  'What was done (e.g. update_online_payment, noop_idempotent, update_sale_payment_status).';

COMMENT ON COLUMN public.payment_reconciliation_log.before_snapshot IS
  'JSON snapshot of relevant rows/fields before apply (online_payments / sales facets).';

COMMENT ON COLUMN public.payment_reconciliation_log.after_snapshot IS
  'JSON snapshot after apply.';

COMMENT ON COLUMN public.payment_reconciliation_log.provider_response IS
  'Normalized or raw provider payload fragment used for the decision.';

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_log_sale_created
  ON public.payment_reconciliation_log (sale_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_reconciliation_log_provider_created
  ON public.payment_reconciliation_log (provider, created_at DESC);

ALTER TABLE public.payment_reconciliation_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT policies for anon/authenticated: edge (service role) and future staff RPC only.
