# Kitchen hours, pause, and soft-close

All **customer-facing** time comparisons for online ordering use **Asia/Baku** wall clock (see `src/lib/kitchenAcceptance.ts` and the mirrored `supabase/functions/_shared/kitchenAcceptance.ts`).

## States

| Status | Meaning |
|--------|---------|
| `OPEN` | Inside `hours_json`, not paused, not in soft-close window (or soft-close disabled). |
| `CLOSING_SOON` | Inside hours, `closing_soon_minutes > 0`, and within that many minutes of the session end. Immediate orders still submit; UI shows last-call copy. **Scheduled** evaluation never returns this (treated as `OPEN`). |
| `PAUSED` | `is_open === false` and (`offline_until` is null **or** current time is before `offline_until`). Blocks immediate orders; scheduled slots after `offline_until` may still be valid if inside hours. |
| `CLOSED` | Outside `hours_json` for the current Baku instant. |

## Database

- `online_settings.offline_until` — optional timestamptz; with `is_open = false`, defines a **timed** pause until that instant. After it passes, acceptance uses hours only (pause lifted for gating) until staff sets `is_open` true again.
- `online_settings.closing_soon_minutes` — integer, default **0** (disabled). Admin: Delivery → Settings.

## Staff surfaces

- **`/order-manager`** — `KitchenStatusPanel`: pause 30 min, 1 h, until next opening (from `hours_json`), indefinite offline, or **Open now** (sets `is_open=true`, `offline_until=null`).
- **Staff cockpit → Delivery → Settings** — same row; per-day hours, `closing_soon_minutes`, and **Cancel pause** when `offline_until` is in the future.

## Edge function

`online-order-create` validates with the shared module:

- Immediate: rejects `PAUSED` / `CLOSED`; allows `CLOSING_SOON`; response may include `closingSoon: true`.
- Scheduled: rejects if the slot is still paused or outside hours (`SCHEDULE_WHILE_PAUSED`, `SCHEDULE_OUTSIDE_HOURS`).

After changing acceptance logic, redeploy:

```bash
supabase functions deploy online-order-create
```

(or `npm run supabase:deploy:order` if defined in your `package.json`).

## Deferred (separate work)

Last-call **staff** workflow: distinct chime, order card badge, one-tap decline with automated refund + SMS. Not implemented in this pass.
