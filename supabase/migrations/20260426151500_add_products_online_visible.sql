-- Adds the public ordering visibility flag used by /order and menu management.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS online_visible boolean NOT NULL DEFAULT true;

UPDATE public.products
SET online_visible = true
WHERE online_visible IS NULL;
