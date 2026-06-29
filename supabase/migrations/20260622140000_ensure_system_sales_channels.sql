/*
  # Ensure required system sales channels (Wolt, Bolt, Kiosk, Online, POS)

  Restores soft-deleted or inactive system rows. ChoiceQR remains optional (not in UPDATE filter).
  POS is upserted with a stable id so Settings always lists the in-store channel.
*/

UPDATE public.sales_channels
SET
  is_deleted = false,
  is_active = true
WHERE lower(trim(name)) IN ('kiosk', 'online', 'pos')
   OR lower(trim(name)) ~ '^(wolt|bolt)(\s|$)'
   OR lower(trim(name)) = 'bolt food';

INSERT INTO public.sales_channels (
  id,
  name,
  description,
  logo_url,
  is_active,
  is_deleted,
  display_order,
  icon,
  color
)
VALUES
  (
    '59e8f2ea-dd1b-4096-808a-f0026b3cc643',
    'Online',
    'Website and mobile ordering',
    NULL,
    true,
    false,
    98,
    'globe',
    '#6366F1'
  ),
  (
    '27571bbe-fadb-48e2-be17-bf71f46ac9e3',
    'Kiosk',
    'In-store self-service kiosk',
    NULL,
    true,
    false,
    99,
    'monitor',
    '#10B981'
  ),
  (
    '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc',
    'Wolt',
    'Food delivery platform',
    '/images/files_8280743-1767952948439-image.png',
    true,
    false,
    999,
    '🛵',
    '#00C2E8'
  ),
  (
    'f91273ac-b4b8-402a-bbb3-d356d64a4459',
    'Bolt',
    'Food delivery and ride-hailing platform',
    '/images/files_8280743-1767952981144-image.png',
    true,
    false,
    999,
    '🚗',
    '#10B981'
  ),
  (
    '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c',
    'POS',
    'In-store point of sale',
    NULL,
    true,
    false,
    97,
    'store',
    '#E11D48'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  is_active = true,
  is_deleted = false,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- Heal POS row if it was created earlier without the canonical id (name match only).
UPDATE public.sales_channels
SET
  is_deleted = false,
  is_active = true
WHERE lower(trim(name)) = 'pos'
  AND id <> '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c';
