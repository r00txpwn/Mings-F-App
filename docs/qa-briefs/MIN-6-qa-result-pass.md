## QA → Cursor result

**Status:** pass

**Summary**

Second-pass QA passed: Order Support drawer shows full order details (no placeholder), correct `data-order-row` / `data-testid="order-support-drawer"` hooks, delivery fields and delivery fee where applicable, workflow action strips aligned with order state, and read-only terminal mode for completed/cancelled orders.

**Scenarios**

- [x] Scenario 1 — Drawer content (blocking): full details, localized status, line items, total in ₼, no `orderSupportDrawerComingSoon` key — pass
- [x] Scenario 2 — Delivery order: address, notes, fee, Wolt tracking when present — pass
- [x] Scenario 3 — Actions smoke: strips match state; workflow transitions as expected on test data — pass
- [x] Scenario 4 — Scheduled pending: scheduled hint + Order Manager path; accept/prepare not incorrectly applied — pass
- [x] Scenario 5 — Terminal states: details visible; no primary action strip (read-only) — pass

**Evidence**

- Screenshot / recording: optional per team; not attached in this run
- Console errors: none reported
- Network errors: none reported
