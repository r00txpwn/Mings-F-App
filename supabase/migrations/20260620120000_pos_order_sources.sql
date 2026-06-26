/*
  # POS order sources (pos_eat_in, pos_takeaway, pos_delivery)

  - Extend shared M### display number pool to POS sources.
  - Extend KDS anon read policies for kitchen queue + completed today.
*/

BEGIN;

-- Extend allocator: include pos_* in active-number collision checks.
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
  v_direct_sources text[] := ARRAY[
    'kiosk', 'online_takeaway', 'online_delivery',
    'pos_eat_in', 'pos_takeaway', 'pos_delivery'
  ];
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
    WHERE s.source = ANY(v_direct_sources)
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
  IF order_source IN (
    'kiosk', 'online_takeaway', 'online_delivery',
    'pos_eat_in', 'pos_takeaway', 'pos_delivery'
  ) THEN
    SELECT daily_order_number, display_number
    INTO v_daily, v_display
    FROM allocate_direct_display_number();
    RETURN v_daily;
  END IF;

  RAISE EXCEPTION 'UNSUPPORTED_ORDER_NUMBER_SOURCE: %', order_source
    USING ERRCODE = 'P0001';
END;
$$;

DROP INDEX IF EXISTS ux_sales_active_direct_display_number;

CREATE UNIQUE INDEX ux_sales_active_direct_display_number
ON sales (display_number)
WHERE source IN (
  'kiosk', 'online_takeaway', 'online_delivery',
  'pos_eat_in', 'pos_takeaway', 'pos_delivery'
)
  AND order_status IN ('pending', 'preparing', 'ready', 'dispatched')
  AND display_number ~ '^M[0-9]{3}$';

-- KDS kitchen queue policy — replace with extended source list.
DROP POLICY IF EXISTS "Anon can read kitchen queue sales" ON public.sales;
CREATE POLICY "Anon can read kitchen queue sales"
  ON public.sales FOR SELECT
  TO anon
  USING (
    source IN (
      'kiosk', 'online_delivery', 'online_takeaway',
      'pos_eat_in', 'pos_takeaway', 'pos_delivery'
    )
    AND order_status IN ('pending', 'preparing', 'ready')
  );

-- KDS completed-today history policy.
DROP POLICY IF EXISTS "Anon can read completed kitchen sales today" ON public.sales;
CREATE POLICY "Anon can read completed kitchen sales today"
  ON public.sales FOR SELECT
  TO anon
  USING (
    source IN (
      'kiosk', 'online_delivery', 'online_takeaway',
      'pos_eat_in', 'pos_takeaway', 'pos_delivery'
    )
    AND order_status = 'completed'
    AND ready_at IS NOT NULL
    AND ready_at >= (
      date_trunc('day', timezone('Asia/Baku', now())) AT TIME ZONE 'Asia/Baku'
    )
  );

DROP POLICY IF EXISTS "Anon can read sale items for completed kitchen sales today" ON public.sale_items;
CREATE POLICY "Anon can read sale items for completed kitchen sales today"
  ON public.sale_items FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND s.source IN (
          'kiosk', 'online_delivery', 'online_takeaway',
          'pos_eat_in', 'pos_takeaway', 'pos_delivery'
        )
        AND s.order_status = 'completed'
        AND s.ready_at IS NOT NULL
        AND s.ready_at >= (
          date_trunc('day', timezone('Asia/Baku', now())) AT TIME ZONE 'Asia/Baku'
        )
    )
  );

COMMIT;
