# Friday-Night Checklist — Owner

One page. Plain English. Use this when the restaurant is live and busy.

You only have to watch **three** things. Everything else is noise.

---

## Risk 1 — Silent money bugs (wrong total, wrong fee, wrong discount)

**Where to look:** `sp.mings.az` → **Sales** screen, latest 10 online orders.

**What to check (takes 60 seconds):**

1. Pick any online order from tonight.
2. Does **Total = Subtotal + Delivery Fee − Discount + Tip**? Do the math in your head.
3. If a promo code was used: is the discount amount sane (not negative, not bigger than subtotal)?
4. Is the delivery fee the same as what the customer saw at checkout?

**Red flags:**
- Total is `0` or negative.
- Discount is bigger than subtotal.
- Delivery fee is `NaN`, blank, or way off (e.g. 50 ₼ for a local order).
- Same customer, same cart, different totals between attempts.

**If something is wrong:**
- Stop. Do **not** refund or hand-edit the order — that hides the bug.
- Screenshot the order row + the customer's receipt.
- Tell the agent: *"Money bug on order `O123`. Here's the screenshot. Don't fix it yet — just tell me what happened."*

---

## Risk 2 — Orders getting lost (kitchen never sees the ticket)

**Where to look:**
- Customer side: `order.mings.az` → try to place a test order yourself.
- Kitchen side: `/kds` (Kitchen Display) — should show the ticket within 5 seconds.
- Staff side: `sp.mings.az` → **Order Support** screen.

**What to check (takes 90 seconds):**

1. On `sp.mings.az` → **Order Manager**, is the **Kitchen Status** banner green/"Open"?
2. Place a 1-item test order as a customer.
3. Within 5 seconds, does it appear on `/kds`?
4. Is the phone number on the order E.164 (starts with `+994...`)? If not, SMS won't reach the customer.

**Red flags:**
- Customer sees "Kitchen is paused" but staff thinks it's open (or vice versa).
- Order is in `sales` table but **not** on the KDS.
- "Closing soon" warning appears but no new orders are being blocked after close time.
- Order shows `pending` for more than 2 minutes with no movement.

**If something is wrong:**
- On `sp.mings.az` → **Order Manager** → **Kitchen Status Panel**, toggle pause OFF and then back to normal. This forces a refresh.
- If the KDS is stale, refresh the `/kds` tab (hard refresh: Ctrl+Shift+R).
- If orders are still missing, tell the agent: *"Test order `O###` created at HH:MM didn't reach KDS."*

---

## Risk 3 — Payments getting stuck (United Payment / legacy EPoint)

**Where to look:** `sp.mings.az` → **Order Support** screen → filter by `payment_status = pending` with `order_status = pending`.

**What to check (takes 30 seconds):**

1. Any **card** order with `payment_status = pending` for more than **15 minutes** after the customer says they paid?
2. Any order with `payment_status = paid` but KDS still shows **authorizing**? (Hard refresh `/kds`; check webhook logs.)
3. **Cash** orders should have `payment_status = unpaid` and KDS should allow prep immediately.

**Red flags:**
- Payment provider dashboard shows success but our row is still `payment_status = pending` → webhook/return failure.
- Customer charged but no matching order → checkout abandoned before `online-order-create` completed.
- Multiple stuck card orders in the same window → provider webhook or return URL misconfigured.

**If something is wrong:**
- Do **not** manually flip `payment_status` in the database. You'll lose the audit trail.
- On the **Order Support** screen, use the "Retry payment reconciliation" action if present.
- Otherwise: screenshot the order + provider dashboard entry + timestamp. Send to the agent: *"Stuck payment on `O###`. Customer charged at HH:MM. Reconcile."*

**Note:** New online orders use `order_status = pending` at create (not `awaiting_payment`). Kitchen visibility on KDS depends on RLS policy **"Anon can read kitchen queue sales"** (migration `20260618140000`).

---

## If the whole thing feels wrong

Three safe, non-destructive buttons you can always press:

1. **Pause the kitchen** — on `sp.mings.az` → **Order Manager** → Kitchen Status → set offline for 15 minutes. Customers get a clear "kitchen paused" message. No orders are lost, no money moves.
2. **Hard refresh everything** — Ctrl+Shift+R on `/kds`, staff cockpit, and the customer tab. 90% of "it's broken" turns out to be a stale tab.
3. **Snapshot and ask** — open `http://127.0.0.1:4175/build-meta.json` on the host running the preview, or check `sp.mings.az` footer for the version. Send that + a screenshot of the bad order to the agent. That's enough context for a fix.

---

## One-line sanity check before Friday rush

Open three tabs in this order and glance for 10 seconds each:

1. `order.mings.az` — can you see the menu? Add an item to cart?
2. `sp.mings.az` → **Order Manager** — Kitchen Status green?
3. `/kds` — does it load, even if empty?

If all three load, the system is up. The rest is edge cases handled by the checks above.

---

*Keep this tab open on Friday night. Everything else — translations, migrations, edge function versions — can wait until Monday.*
