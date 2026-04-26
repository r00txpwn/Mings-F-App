/*
  # P0 seed: menu + storefront config

  Seeds only the small menu/config surface needed to boot the new Supabase
  project. No customer, sales-history, payment, auth, saved-card, or supplier
  data is included here.

  Source: read-only old/current production queries gathered on 2026-04-26.
*/

-- Replace same-name default rows from the historical migration chain before
-- inserting the old production UUIDs. This fresh-production seed is intended
-- to run before real data is added.
DELETE FROM public.master_categories
WHERE name IN ('Noodles', 'Rice', 'Bites', 'drinks')
  AND id NOT IN (
    'aaf33994-a5cc-421a-b09e-8646baeb2158',
    'be7675b7-9f45-4647-a8ed-7bf408fb9d75',
    '7a503c62-6b5d-430d-90df-4e59012749a8',
    'cc490209-7541-444c-b4ff-c5f44e9c7aa4'
  );

INSERT INTO public.master_categories (
  id,
  name,
  description,
  type,
  icon,
  color,
  display_order,
  created_at
)
VALUES
  (
    'aaf33994-a5cc-421a-b09e-8646baeb2158',
    'Noodles',
    '',
    'menu'::public.category_type,
    '🍽️',
    '#EF4444',
    1,
    now()
  ),
  (
    'be7675b7-9f45-4647-a8ed-7bf408fb9d75',
    'Rice',
    '',
    'menu'::public.category_type,
    '🍽️',
    '#EF4444',
    2,
    now()
  ),
  (
    '7a503c62-6b5d-430d-90df-4e59012749a8',
    'Bites',
    '',
    'menu'::public.category_type,
    '🍽️',
    '#EF4444',
    3,
    now()
  ),
  (
    'cc490209-7541-444c-b4ff-c5f44e9c7aa4',
    'drinks',
    '',
    'menu'::public.category_type,
    '🥤',
    '#EC4899',
    4,
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order;

DELETE FROM public.sales_channels
WHERE name IN ('Online', 'Kiosk', 'Bolt', 'ChoiceQR', 'Wolt')
  AND id NOT IN (
    '59e8f2ea-dd1b-4096-808a-f0026b3cc643',
    '27571bbe-fadb-48e2-be17-bf71f46ac9e3',
    'f91273ac-b4b8-402a-bbb3-d356d64a4459',
    'c84b69dd-c3de-4fd6-a8a5-e1c7390d2ae3',
    '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc'
  );

INSERT INTO public.sales_channels (
  id,
  name,
  description,
  logo_url,
  is_active,
  display_order,
  icon,
  color,
  created_at,
  updated_at
)
VALUES
  (
    '59e8f2ea-dd1b-4096-808a-f0026b3cc643',
    'Online',
    '',
    NULL,
    true,
    98,
    'globe',
    '#6366F1',
    '2026-03-22 10:22:54.6186+00',
    '2026-03-22 10:22:54.6186+00'
  ),
  (
    '27571bbe-fadb-48e2-be17-bf71f46ac9e3',
    'Kiosk',
    '',
    NULL,
    true,
    99,
    'monitor',
    '#10B981',
    '2026-02-26 08:51:28.677937+00',
    '2026-02-26 08:51:28.677937+00'
  ),
  (
    'f91273ac-b4b8-402a-bbb3-d356d64a4459',
    'Bolt',
    'Food delivery and ride-hailing platform',
    '/images/files_8280743-1767952981144-image.png',
    true,
    999,
    '🚗',
    '#10B981',
    '2026-01-09 11:49:31.109167+00',
    '2026-01-09 11:49:31.109167+00'
  ),
  (
    'c84b69dd-c3de-4fd6-a8a5-e1c7390d2ae3',
    'ChoiceQR',
    'QR code ordering system',
    '/images/files_8280743-1767953019500-image.png',
    true,
    999,
    '📱',
    '#F59E0B',
    '2026-01-09 11:49:31.109167+00',
    '2026-01-09 11:49:31.109167+00'
  ),
  (
    '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc',
    'Wolt',
    'Food delivery platform',
    '/images/files_8280743-1767952948439-image.png',
    true,
    999,
    '🛵',
    '#00C2E8',
    '2026-01-09 11:49:31.109167+00',
    '2026-01-09 11:49:31.109167+00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.products (
  id,
  name,
  barcode,
  master_category_id,
  quantity,
  cost_price,
  selling_price,
  min_stock_level,
  description,
  last_order_quantity,
  supplier_id,
  unit,
  kiosk_visible,
  image_url,
  display_order,
  online_visible,
  combo_upsell_eligible,
  is_deleted,
  is_halal,
  upsell_combo_id,
  created_at,
  updated_at
)
VALUES
  (
    '2886a90a-2188-462a-a15b-b19a94c73832',
    'Chicken Noodles',
    NULL,
    'aaf33994-a5cc-421a-b09e-8646baeb2158',
    0,
    0.00,
    9.38,
    0,
    '',
    0,
    NULL,
    'pcs'::public.product_unit,
    true,
    NULL,
    0,
    true,
    false,
    false,
    false,
    NULL,
    '2026-04-18 13:48:13.414187+00',
    '2026-04-18 13:48:13.414187+00'
  ),
  (
    '283beaf2-c9b3-4d14-8bac-39a93be5f00c',
    'Shrimp Noodles',
    NULL,
    'aaf33994-a5cc-421a-b09e-8646baeb2158',
    0,
    0.00,
    15.00,
    0,
    '',
    0,
    NULL,
    'pcs'::public.product_unit,
    true,
    NULL,
    0,
    true,
    false,
    false,
    false,
    NULL,
    '2026-04-18 13:48:28.175456+00',
    '2026-04-18 13:48:28.175456+00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  barcode = EXCLUDED.barcode,
  master_category_id = EXCLUDED.master_category_id,
  quantity = EXCLUDED.quantity,
  cost_price = EXCLUDED.cost_price,
  selling_price = EXCLUDED.selling_price,
  min_stock_level = EXCLUDED.min_stock_level,
  description = EXCLUDED.description,
  last_order_quantity = EXCLUDED.last_order_quantity,
  supplier_id = EXCLUDED.supplier_id,
  unit = EXCLUDED.unit,
  kiosk_visible = EXCLUDED.kiosk_visible,
  image_url = EXCLUDED.image_url,
  display_order = EXCLUDED.display_order,
  online_visible = EXCLUDED.online_visible,
  combo_upsell_eligible = EXCLUDED.combo_upsell_eligible,
  is_deleted = EXCLUDED.is_deleted,
  is_halal = EXCLUDED.is_halal,
  upsell_combo_id = EXCLUDED.upsell_combo_id,
  updated_at = EXCLUDED.updated_at;

INSERT INTO public.modifier_groups (
  id,
  product_id,
  name,
  display_order,
  min_select,
  max_select,
  is_required,
  created_at
)
VALUES
  (
    '4941e020-25dc-4f31-87f8-ed0fbc455b7e',
    NULL,
    'Extra Chicken',
    2,
    0,
    4,
    false,
    '2026-04-18 13:49:57.886668+00'
  ),
  (
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    NULL,
    'Spicy Options',
    1,
    0,
    4,
    true,
    '2026-04-18 13:48:47.758544+00'
  )
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  min_select = EXCLUDED.min_select,
  max_select = EXCLUDED.max_select,
  is_required = EXCLUDED.is_required;

INSERT INTO public.modifier_options (
  id,
  modifier_group_id,
  name,
  price_adjustment,
  image_url,
  is_default,
  is_available,
  display_order,
  created_at
)
VALUES
  (
    'f570a424-ef6d-48e2-aad8-ad14d1eb9914',
    '4941e020-25dc-4f31-87f8-ed0fbc455b7e',
    'Add Extra',
    1,
    NULL,
    false,
    true,
    1,
    '2026-04-18 13:50:14.034384+00'
  ),
  (
    'f9267288-7cda-4650-aa7b-eeb694354712',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    'Level 1',
    0,
    NULL,
    true,
    true,
    1,
    '2026-04-18 13:49:00.346734+00'
  ),
  (
    'ac58352b-08cb-407f-8568-7a8ff96f5f18',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    'Level 2',
    0,
    NULL,
    false,
    true,
    2,
    '2026-04-18 13:49:10.615144+00'
  ),
  (
    '8c8e2e80-260b-4a89-9c3e-095ce7f0790b',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    'Level 3',
    0,
    NULL,
    false,
    true,
    3,
    '2026-04-18 13:49:19.45747+00'
  ),
  (
    'f53bcb1a-01f7-4577-953e-1e40bace5da8',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    'Level X',
    0,
    NULL,
    false,
    true,
    4,
    '2026-04-18 13:49:27.407426+00'
  )
ON CONFLICT (id) DO UPDATE SET
  modifier_group_id = EXCLUDED.modifier_group_id,
  name = EXCLUDED.name,
  price_adjustment = EXCLUDED.price_adjustment,
  image_url = EXCLUDED.image_url,
  is_default = EXCLUDED.is_default,
  is_available = EXCLUDED.is_available,
  display_order = EXCLUDED.display_order;

INSERT INTO public.product_modifier_groups (
  id,
  product_id,
  modifier_group_id,
  display_order,
  created_at
)
VALUES
  (
    'ee2f747c-a21e-47eb-93e0-59cda6032dc6',
    '283beaf2-c9b3-4d14-8bac-39a93be5f00c',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    0,
    '2026-04-18 13:50:31.643906+00'
  ),
  (
    'fe6370b0-bf9e-47fd-9ff3-700b1d36018f',
    '283beaf2-c9b3-4d14-8bac-39a93be5f00c',
    '4941e020-25dc-4f31-87f8-ed0fbc455b7e',
    1,
    '2026-04-18 13:50:32.521159+00'
  ),
  (
    '08680eef-0af5-4ffb-b09e-931c58627bd4',
    '2886a90a-2188-462a-a15b-b19a94c73832',
    '53cc70a0-e8b7-41bf-bba0-420511c4a94c',
    0,
    '2026-04-18 13:50:26.169299+00'
  ),
  (
    'c0482503-df43-45e5-b6a5-d0134f7590cb',
    '2886a90a-2188-462a-a15b-b19a94c73832',
    '4941e020-25dc-4f31-87f8-ed0fbc455b7e',
    1,
    '2026-04-18 13:50:27.077661+00'
  )
ON CONFLICT (product_id, modifier_group_id) DO UPDATE SET
  display_order = EXCLUDED.display_order,
  created_at = EXCLUDED.created_at;

-- Drop any bootstrap or stray online_settings rows so a single canonical row remains.
DELETE FROM public.online_settings
WHERE id <> '4dfbb844-ea34-4dd3-89aa-349c9edce57a';

WITH desired AS (
  SELECT
    '4dfbb844-ea34-4dd3-89aa-349c9edce57a'::uuid AS id,
    true AS takeaway_enabled,
    true AS delivery_enabled,
    $json$
    {
      "fri": { "open": "10:00", "close": "23:00", "closed": false },
      "mon": { "open": "10:00", "close": "23:00", "closed": false },
      "sat": { "open": "10:00", "close": "23:00", "closed": false },
      "sun": { "open": "10:00", "close": "23:00", "closed": false },
      "thu": { "open": "10:00", "close": "23:00", "closed": false },
      "tue": { "open": "10:00", "close": "23:00", "closed": false },
      "wed": { "open": "10:00", "close": "23:00", "closed": false }
    }
    $json$::jsonb AS hours_json,
    0.00::numeric AS min_order_amount,
    '2026-03-22 10:22:54.6186+00'::timestamptz AS updated_at,
    NULL::text AS tagline,
    NULL::text AS hero_image_url,
    true AS is_open,
    25::integer AS default_prep_time_minutes,
    0.01::numeric AS free_delivery_threshold,
    'auto'::text AS dispatch_mode,
    40.3777::double precision AS kitchen_lat,
    49.892::double precision AS kitchen_lng,
    NULL::timestamptz AS offline_until,
    0::integer AS closing_soon_minutes
)
INSERT INTO public.online_settings (
  id,
  takeaway_enabled,
  delivery_enabled,
  hours_json,
  min_order_amount,
  updated_at,
  tagline,
  hero_image_url,
  is_open,
  default_prep_time_minutes,
  free_delivery_threshold,
  dispatch_mode,
  kitchen_lat,
  kitchen_lng,
  offline_until,
  closing_soon_minutes
)
SELECT
  id,
  takeaway_enabled,
  delivery_enabled,
  hours_json,
  min_order_amount,
  updated_at,
  tagline,
  hero_image_url,
  is_open,
  default_prep_time_minutes,
  free_delivery_threshold,
  dispatch_mode,
  kitchen_lat,
  kitchen_lng,
  offline_until,
  closing_soon_minutes
FROM desired
ON CONFLICT (id) DO UPDATE SET
  takeaway_enabled = EXCLUDED.takeaway_enabled,
  delivery_enabled = EXCLUDED.delivery_enabled,
  hours_json = EXCLUDED.hours_json,
  min_order_amount = EXCLUDED.min_order_amount,
  updated_at = EXCLUDED.updated_at,
  tagline = EXCLUDED.tagline,
  hero_image_url = EXCLUDED.hero_image_url,
  is_open = EXCLUDED.is_open,
  default_prep_time_minutes = EXCLUDED.default_prep_time_minutes,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  dispatch_mode = EXCLUDED.dispatch_mode,
  kitchen_lat = EXCLUDED.kitchen_lat,
  kitchen_lng = EXCLUDED.kitchen_lng,
  offline_until = EXCLUDED.offline_until,
  closing_soon_minutes = EXCLUDED.closing_soon_minutes;

INSERT INTO public.delivery_zones (
  id,
  name,
  polygon,
  delivery_fee,
  min_order_amount,
  is_active,
  created_at,
  free_delivery_threshold,
  sort_order,
  updated_at
)
VALUES
  (
    'ccb2d57b-574e-44ef-86ab-0bcd4ae4f851',
    'Baku Central',
    '{"type":"Polygon","coordinates":[[[49.79,40.45],[49.97,40.45],[49.97,40.34],[49.79,40.34],[49.79,40.45]]]}'::jsonb,
    2.50,
    0.00,
    true,
    '2026-04-19 11:09:32.473333+00',
    NULL,
    0,
    '2026-04-20 13:56:13.789746+00'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  polygon = EXCLUDED.polygon,
  delivery_fee = EXCLUDED.delivery_fee,
  min_order_amount = EXCLUDED.min_order_amount,
  is_active = EXCLUDED.is_active,
  free_delivery_threshold = EXCLUDED.free_delivery_threshold,
  sort_order = EXCLUDED.sort_order,
  updated_at = EXCLUDED.updated_at;
