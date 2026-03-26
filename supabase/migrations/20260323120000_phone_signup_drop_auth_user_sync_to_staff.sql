/*
  # Fix phone OTP: "Database error saving new user" (500 on /auth/v1/otp)

  Phone signups create auth.users rows with email = NULL. Common Supabase / template
  triggers insert into public.users using NEW.email as username → NOT NULL violation
  or invalid row. Staff belong in public.users; customers must NOT be auto-inserted here.

  This migration drops well-known trigger/function names from dashboard templates.
  DROP … IF EXISTS is safe when objects are absent.
*/

-- Typical Supabase / SQL template names (adjust in Dashboard if yours differ)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_create ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_insert ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_signup() CASCADE;
