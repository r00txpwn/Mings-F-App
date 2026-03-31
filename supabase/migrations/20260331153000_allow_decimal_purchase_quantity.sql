/*
  # Allow decimal quantities in purchases

  Problem:
  - Purchases form accepts decimal quantity (step 0.01), but DB column
    `purchases.quantity` is integer in existing schema.
  - Inserting values like 1.5 causes PostgREST 400 and purchase is not saved.

  Fix:
  - Convert `purchases.quantity` to numeric(10,2)
  - Keep a positive-value check constraint
*/

ALTER TABLE purchases
  ALTER COLUMN quantity TYPE numeric(10,2) USING quantity::numeric(10,2);

ALTER TABLE purchases
  DROP CONSTRAINT IF EXISTS purchases_quantity_check;

ALTER TABLE purchases
  ADD CONSTRAINT purchases_quantity_check CHECK (quantity > 0);
