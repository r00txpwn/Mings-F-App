/*
  # Remove stock check module
  Rollback for stock check feature:
  - Drop stock_check_items and stock_checks tables
  - Remove can_stock_check from public.users
*/

DROP TABLE IF EXISTS public.stock_check_items;
DROP TABLE IF EXISTS public.stock_checks;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS can_stock_check;
