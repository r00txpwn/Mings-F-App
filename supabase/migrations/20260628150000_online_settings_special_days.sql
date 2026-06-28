/*
  # Special days / holidays for online kitchen hours

  One-off calendar dates (Baku) that override weekly hours_json.
  Each entry may be closed all day or custom open/close, with optional
  per-language customer notes shown on the online order portal.
*/

ALTER TABLE public.online_settings
  ADD COLUMN IF NOT EXISTS special_days_json jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.online_settings.special_days_json IS
  'Array of { date, closed, open?, close?, note_en?, note_az?, note_ru? } — Baku YYYY-MM-DD; overrides hours_json for that date.';
