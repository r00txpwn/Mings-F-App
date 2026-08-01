/*
  # Employee leave date for month payroll proration

  Additive only — sandbox/local first:
  - Adds employees.left_at (last employed day, inclusive)
  - No DROP, no data deletes
*/

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS left_at date;
