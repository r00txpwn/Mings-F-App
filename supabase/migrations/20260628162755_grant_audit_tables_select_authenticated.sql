/*
  # Grant SELECT on audit tables to authenticated (remote MCP timestamp)

  Same change as 20260628140000_grant_audit_tables_select_authenticated.sql.
  Applied on the linked Supabase project via MCP as version 20260628162755;
  this file exists so `supabase db push` local/remote history stays in sync.
*/

GRANT SELECT ON TABLE public.admin_audit_log TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;
