/*
  # Purchases payment method (Phase 1.5 — COGS account routing)

  - Adds purchases.payment_method so a purchase recorded as "paid now"
    (is_on_credit = false) records which account it was paid from
    (cash / card / bank_transfer) and deducts from that balance.
  - "On account" purchases stay null: no money moves until the supplier
    is paid via supplier_account_payments (already tracked).
*/

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS payment_method text;
