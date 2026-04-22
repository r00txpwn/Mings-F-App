# Phone OTP: database and RPC issues

## `PGRST202` — `Could not find the function public.rpc_request_phone_otp(phone)`

The Order app calls **`rpc_request_phone_otp`** before sending an SMS to enforce a short cooldown. PostgREST returns **PGRST202** when that function is **not present** in the database PostgREST is using (pending migration, wrong project, or schema cache not refreshed yet).

**Fix:** apply migrations to the **same** Supabase project as `VITE_SUPABASE_URL`:

```bash
npm run supabase:push
```

The function is created in:

`supabase/migrations/20260421174000_checkout_promos_loyalty_errors.sql`

(it also ensures `public.otp_requests` exists).

If that migration was skipped on a host, apply the idempotent follow-up:

`supabase/migrations/20260422194244_ensure_rpc_request_phone_otp.sql` (or use **Supabase MCP** → `apply_migration` with the same SQL).

If you cannot use the CLI, run the `otp_requests` block and `CREATE OR REPLACE FUNCTION public.rpc_request_phone_otp(...)` from that file in **Supabase Dashboard → SQL Editor**, then wait a minute or reload the API schema.

---

## `Database error saving new user` (500 on `/auth/v1/otp`)

That message comes from **Supabase Auth** when the **database transaction** for a new user fails — usually a **trigger** or **Auth Hook**, not your React code.

## Most common cause in this project

`public.users` requires **`username NOT NULL`**. If a trigger on `auth.users` does something like:

```sql
INSERT INTO public.users (id, username) VALUES (NEW.id, NEW.email);
```

then **phone-only** users have `NEW.email IS NULL` → insert fails → **500** with “Database error saving new user”.

**Staff** should be added to `public.users` manually or via admin flows — **not** for every Auth signup.

## Fix (already in repo)

Apply migration:

`supabase/migrations/20260323120000_phone_signup_drop_auth_user_sync_to_staff.sql`

```bash
npm run supabase:push
```

## If it still fails

1. **Supabase Dashboard → Database → Triggers**  
   Filter table `auth.users` (schema `auth`). Note any **custom** trigger names not covered by the migration.

2. **Authentication → Hooks**  
   If a **Send SMS** or **Before user created** hook calls an Edge Function that errors, disable or fix it.

3. **Authentication → Providers → Phone**  
   Confirm Twilio / SMS settings; trial accounts may only send to verified numbers.

4. **SQL — list triggers on `auth.users`**

```sql
SELECT tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' AND c.relname = 'users' AND NOT t.tgisinternal;
```

Drop any custom trigger that inserts into `public.users` without handling phone-only users.
