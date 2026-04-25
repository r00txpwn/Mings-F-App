/*
  # Shared rolling direct order numbers (M001..M999)

  - One allocator for kiosk + online takeaway + online delivery.
  - No daily reset, no source-specific counters.
  - Active direct orders must not share a visible display number.
*/

BEGIN;

-- Preflight (run manually before prod apply):
-- 1) Active duplicates that would block the partial unique index:
-- SELECT display_number, COUNT(*) AS active_count, ARRAY_AGG(id ORDER BY created_at DESC) AS sale_ids
-- FROM sales
-- WHERE source IN ('kiosk', 'online_takeaway', 'online_delivery')
--   AND order_status IN ('pending', 'preparing', 'ready', 'dispatched')
--   AND display_number ~ '^M[0-9]{3}$'
-- GROUP BY display_number
-- HAVING COUNT(*) > 1
-- ORDER BY active_count DESC, display_number;
--
-- 2) Optional sanity for active direct rows missing valid M-format:
-- SELECT id, source, order_status, display_number
-- FROM sales
-- WHERE source IN ('kiosk', 'online_takeaway', 'online_delivery')
--   AND order_status IN ('pending', 'preparing', 'ready', 'dispatched')
--   AND (display_number IS NULL OR display_number !~ '^M[0-9]{3}$');

CREATE TABLE IF NOT EXISTS direct_order_number_allocator (
  key text PRIMARY KEY,
  last_issued smallint NOT NULL CHECK (last_issued BETWEEN 0 AND 999),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE direct_order_number_allocator IS
  'Allocator state for direct Mings order numbers M001..M999.';

INSERT INTO direct_order_number_allocator (key, last_issued)
VALUES (
  'mings_direct',
  COALESCE((
    SELECT MAX(SUBSTRING(display_number FROM 2 FOR 3)::int)
    FROM sales
    WHERE source IN ('kiosk', 'online_takeaway', 'online_delivery')
      AND display_number ~ '^M[0-9]{3}$'
  ), 0)
)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION allocate_direct_display_number()
RETURNS TABLE(daily_order_number int, display_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last int;
  v_candidate int;
  v_i int;
  v_display text;
  v_exists int;
BEGIN
  SELECT last_issued
  INTO v_last
  FROM direct_order_number_allocator
  WHERE key = 'mings_direct'
  FOR UPDATE;

  IF v_last IS NULL THEN
    INSERT INTO direct_order_number_allocator(key, last_issued)
    VALUES ('mings_direct', 0)
    ON CONFLICT (key) DO NOTHING;

    SELECT last_issued
    INTO v_last
    FROM direct_order_number_allocator
    WHERE key = 'mings_direct'
    FOR UPDATE;
  END IF;

  FOR v_i IN 1..999 LOOP
    v_candidate := ((v_last + v_i - 1) % 999) + 1;
    v_display := 'M' || LPAD(v_candidate::text, 3, '0');

    SELECT 1
    INTO v_exists
    FROM sales s
    WHERE s.source IN ('kiosk', 'online_takeaway', 'online_delivery')
      AND s.order_status IN ('pending', 'preparing', 'ready', 'dispatched')
      AND s.display_number = v_display
    LIMIT 1;

    IF v_exists IS NULL THEN
      UPDATE direct_order_number_allocator
      SET last_issued = v_candidate,
          updated_at = now()
      WHERE key = 'mings_direct';

      daily_order_number := v_candidate;
      display_number := v_display;
      RETURN NEXT;
      RETURN;
    END IF;

    v_exists := NULL;
  END LOOP;

  RAISE EXCEPTION 'DIRECT_NUMBER_POOL_EXHAUSTED'
    USING ERRCODE = 'P0001';
END;
$$;

COMMENT ON FUNCTION allocate_direct_display_number() IS
  'Allocates the next free active direct order number (M001..M999) with rollover.';

CREATE OR REPLACE FUNCTION generate_daily_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily int;
  v_display text;
BEGIN
  SELECT daily_order_number, display_number
  INTO v_daily, v_display
  FROM allocate_direct_display_number();

  RETURN v_daily;
END;
$$;

CREATE OR REPLACE FUNCTION generate_daily_order_number_for_source(order_source text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily int;
  v_display text;
BEGIN
  IF order_source IN ('kiosk', 'online_takeaway', 'online_delivery') THEN
    SELECT daily_order_number, display_number
    INTO v_daily, v_display
    FROM allocate_direct_display_number();
    RETURN v_daily;
  END IF;

  RAISE EXCEPTION 'UNSUPPORTED_ORDER_NUMBER_SOURCE: %', order_source
    USING ERRCODE = 'P0001';
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_active_direct_display_number
ON sales (display_number)
WHERE source IN ('kiosk', 'online_takeaway', 'online_delivery')
  AND order_status IN ('pending', 'preparing', 'ready', 'dispatched')
  AND display_number ~ '^M[0-9]{3}$';

GRANT EXECUTE ON FUNCTION allocate_direct_display_number() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_daily_order_number() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION generate_daily_order_number_for_source(text) TO anon, authenticated, service_role;

COMMIT;

