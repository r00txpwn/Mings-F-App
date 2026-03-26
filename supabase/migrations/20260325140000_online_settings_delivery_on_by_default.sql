/*
  # Ensure online ordering shows Pickup + Delivery in the storefront

  Re-applies delivery_enabled / takeaway_enabled for projects where an older seed
  left delivery off. Safe to run multiple times.
*/

UPDATE public.online_settings
SET
  takeaway_enabled = true,
  delivery_enabled = true
WHERE EXISTS (SELECT 1 FROM public.online_settings);
