/*
  # Restore public.users privileges for Edge Functions

  user-management and staffAuth read public.users with the service_role key.
  After table recreates, service_role can lose table GRANTs and Postgres returns:
  "permission denied for table users".
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;

-- Cockpit AuthContext reads staff role for signed-in users (idempotent).
GRANT SELECT ON TABLE public.users TO authenticated;
