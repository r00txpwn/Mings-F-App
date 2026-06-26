/*
  # Ensure Wolt / Bolt / ChoiceQR partner channels for manual Sales entry

  Restores soft-deleted or inactive partner rows and inserts canonical channels when missing.
*/

UPDATE public.sales_channels
SET
  is_deleted = false,
  is_active = true
WHERE lower(trim(name)) ~ '^(wolt|bolt)(\s|$)|^choice\s*qr$'
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
    'c84b69dd-c3de-4fd6-a8a5-e1c7390d2ae3',
    'ChoiceQR',
    'QR code ordering system',
    '/images/files_8280743-1767953019500-image.png',
    true,
    false,
    999,
    '📱',
    '#F59E0B'
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
