/*
  # Enable both pickup (takeaway) and delivery for online orders

  Many projects had only takeaway enabled in `online_settings`. This sets both flags
  to true so customers see Pickup + Delivery in /order. Turn either off in Supabase
  Table Editor or admin UI if you need a single mode.
*/

UPDATE public.online_settings
SET
  takeaway_enabled = true,
  delivery_enabled = true
WHERE EXISTS (SELECT 1 FROM public.online_settings);
