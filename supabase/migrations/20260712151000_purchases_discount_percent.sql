-- Vendor discount on COGS purchases: list unit price × (1 - discount%) = net total.

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS discount_percent numeric(6,3) NOT NULL DEFAULT 0
  CHECK (discount_percent >= 0 AND discount_percent <= 100);

COMMENT ON COLUMN purchases.discount_percent IS
  'Vendor discount applied to list unit_cost. total_cost = quantity * unit_cost * (1 - discount_percent/100).';
