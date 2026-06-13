# Production Supabase Launch Plan

Owner-facing plan for preparing Mings direct customer orders for production without destroying useful staging/admin configuration.

## Decision

Create a separate Supabase project for production instead of dropping the current database.

The current linked Supabase project should be treated as staging/testing because it may contain valuable admin/dashboard configuration, such as menu data, categories, sales channels, delivery zones, staff setup, expenses, inventory, and other settings that are not hardcoded.

## Environment Roles

| Project | Purpose | Rule |
| --- | --- | --- |
| Current Supabase project | Staging/testing/Cursor work | Can contain test orders and experimental validation, but do not drop casually |
| New Supabase project | Production | Clean production data only; no fake orders/payments |

## Production Setup Checklist

1. Create a new Supabase project for production.
2. Apply repo migrations in order.
3. Deploy required Edge Functions.
4. Add required function secrets and environment variables.
5. Import only approved business configuration:
   - menu items
   - categories
   - modifiers/options
   - delivery zones
   - staff/admin profiles
   - sales channels/settings
   - expense/inventory configuration if needed
6. Do not import fake orders, test payments, sandbox sales, or reconciliation test logs.
7. Connect production frontend/deployment environment variables to the new project:
   - **Two Vercel projects** (see [DEPLOY.md](../DEPLOY.md)): `order.mings.az` → `npm run build:storefront` → `dist-storefront/`; `sp.mings.az` → `npm run build:staff` → `dist-staff/`.
   - Both need `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - **`VITE_KDS_SECRET` / `VITE_KIOSK_SECRET` only on the staff project**; set matching Edge secret **`KDS_SECRET`** for `kds-order-status-update`.
   - Deploy **`admin-api`** + **`kds-order-status-update`** after migration `20260610120000_harden_staff_only_rls.sql`.
8. Run smoke tests before launch.
9. After launch, treat the production database as production-sensitive:
   - no full resets
   - no manual row edits as the normal fix path
   - no migrations, policy changes, or function deploys without approval and rollback plan

## Production launch: KDS access checklist (`VITE_KDS_SECRET`)

This gate only controls **who can open the `/kds` UI**. It does **not** change the approved workflow where **Order Manager Accept** controls when orders appear in KDS.

Before production frontend deploy:

- [ ] Confirm `VITE_KDS_SECRET` is set in the **production** frontend build environment (long random value; stored only in the host’s env UI, not in git).
- [ ] **Rebuild and redeploy** the frontend after setting or changing it.
- [ ] Verify **`/kds`** without `?key` shows **Access Denied** on the production KDS URL.
- [ ] Verify **`/kds?key=<secret>`** opens on the kitchen device (bookmark the full URL; rotate the secret if it leaks).

## Important Auth Warning

Supabase Auth users may not migrate cleanly by copying ordinary tables. Staff/admin users may need to be recreated or migrated carefully. Plan this before launch so managers are not locked out.

## Do Not Drop Current DB Without Export Plan

Before any full reset/drop proposal, Cursor must list:

- what tables/data would be lost
- what configuration must be exported first
- how the data will be restored
- whether auth users, staff roles, delivery zones, menu data, and sales channels are affected

Default rule: use targeted cleanup or a separate resettable staging project instead of dropping the current database.

## Payment Model First Brick

Approved first implementation step:

Disambiguate new online order payment methods without adding a new database column yet.

Use clear persisted method values for new online orders:

- `card_online`
- `cash_pickup`
- `cash_delivery`

Keep backward compatibility:

- legacy `epoint` means `card_online`
- legacy `cod` means infer `cash_pickup` or `cash_delivery` from fulfillment/source
- legacy `cash` should not break readers

Staff-facing labels must clearly distinguish:

- Card authorizing
- Card paid
- Cash due at pickup
- Cash due on delivery

Do not add `cash_collection_status` in the first PR. That may be the right long-term model, but it adds schema, backfill, reporting, audit, and staff action complexity. First reduce the highest operational ambiguity with method disambiguation and clear labels.

## Cursor Prompt

```text
Owner decision:
We will create a separate Supabase project for production instead of dropping the current DB.

Treat:
- current linked Supabase project = staging/testing
- new Supabase project = production

Plan only for now:
Create a production Supabase launch plan that lists:
- required migrations
- required Edge Functions
- required secrets
- required seed/config tables
- data to copy from staging
- data NOT to copy
- auth/staff user setup risks
- env vars that must be swapped in frontend/deployment
- smoke tests after swap

Do not mutate either project yet.
Do not deploy.
Do not rotate keys yet.
```

## Cursor Prompt For Payment First Brick

```text
Approved for scoped implementation.

Mode:
Implement scoped fix, not full payment model migration.

Approved scope:
1. Disambiguate persisted payment method for NEW online orders:
   - card_online
   - cash_pickup
   - cash_delivery

2. Preserve backward compatibility:
   - legacy epoint means card_online
   - legacy cod means infer cash_pickup vs cash_delivery from fulfillment/source
   - legacy cash should not break readers

3. Update /order checkout payload and server-side online-order-create normalization.

4. Update /order-manager and /kds payment badges/copy so staff never see generic "pending" for cash orders.

5. Keep current card settlement rules:
   - card paid only via EPoint webhook/reconcile, except existing audited/manual emergency path if already present
   - do not make cash orders look provider-paid

Not approved in this PR:
- No new cash_collection_status column yet
- No production data backfill
- No cron
- No United Payment implementation
- No provider switch
- No production deploy
- No reconciliation of real payment rows

Required safeguards:
- Server-side normalization must be authoritative. Do not trust only the frontend.
- Existing orders with cod/epoint must still render correctly.
- KDS must continue blocking unpaid card orders from prep.
- KDS must allow cash orders according to current policy, but label them clearly as cash pickup or cash delivery.
- Do not manually edit docs/QA_STATUS.md.

Validation required:
- npm run typecheck
- npm run lint
- npm run build if practical
- Manual preview/staging QA:
  1. takeaway + card_online
  2. delivery + card_online
  3. takeaway + cash_pickup
  4. delivery + cash_delivery
  5. legacy cod order still displays correctly
  6. failed/unpaid card does not display as cash due

Return before shipping:
- Files changed
- Exact mapping rules
- Screenshots or clear description of Order Manager/KDS badges
- Any remaining ambiguity
- Whether any tests failed or were skipped
```
