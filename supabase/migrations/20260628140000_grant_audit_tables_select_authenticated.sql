/*
  # Grant SELECT on audit tables to authenticated (fix Audit Log screen)

  admin_audit_log and audit_logs had admin-only RLS policies but never received
  table-level SELECT grants for the authenticated role. PostgREST then returns
  "permission denied for table admin_audit_log" before RLS is evaluated.

  auth_events already has GRANT SELECT, INSERT from 20260628130000.
*/

GRANT SELECT ON TABLE public.admin_audit_log TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;
