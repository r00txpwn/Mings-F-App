/*
  # Audit hardening + staff auth events (Workstream C)

  - Restrict audit_logs + admin_audit_log reads to admin only
  - Add auth_events for basic staff login tracking (who / when / surface / device)
  - Extend row-level audit triggers to finance / catalog tables added after the
    original audit migration
*/

-- is_admin() may already exist from 20260628120000_restrict_cockpit_writes_to_admin_manager.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- audit_logs — admin read only (triggers remain append-only via SECURITY DEFINER)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_audit_log — admin read only (written by Edge Functions via service role)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can read admin audit log" ON public.admin_audit_log;

CREATE POLICY "Admins can read admin audit log"
  ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- auth_events — staff sign-in/out telemetry (basic; no IP)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('login', 'logout')),
  surface text,
  device_type text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON public.auth_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON public.auth_events (user_id, created_at DESC);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.auth_events TO authenticated;

DROP POLICY IF EXISTS "Admins can read auth events" ON public.auth_events;
CREATE POLICY "Admins can read auth events"
  ON public.auth_events FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert own auth events" ON public.auth_events;
CREATE POLICY "Users can insert own auth events"
  ON public.auth_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Extend row audit triggers (skip missing tables)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._ensure_audit_trigger(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  reg regclass := to_regclass('public.' || p_table);
  trg_name text := p_table || '_audit_trigger';
BEGIN
  IF reg IS NULL THEN
    RAISE NOTICE 'audit: skipping missing table %', p_table;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = p_table AND t.tgname = trg_name
  ) THEN
    RETURN;
  END IF;

  EXECUTE format(
    'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event()',
    trg_name,
    p_table
  );
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'purchases',
    'operational_expenses',
    'expense_items',
    'master_categories',
    'liabilities',
    'liability_payments',
    'bank_withdrawals',
    'cash_movements',
    'platform_payouts',
    'delivery_zones',
    'online_settings',
    'employees',
    'salary_payments',
    'tax_settings',
    'tax_payments',
    'combo_deals',
    'combo_groups',
    'combo_group_items',
    'modifier_groups',
    'modifier_options',
    'product_modifier_groups',
    'supplier_debts',
    'supplier_account_payments'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    PERFORM public._ensure_audit_trigger(t);
  END LOOP;
END $$;

DROP FUNCTION public._ensure_audit_trigger(text);
