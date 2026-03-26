# Phone OTP: `Database error saving new user` (500 on `/auth/v1/otp`)

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
