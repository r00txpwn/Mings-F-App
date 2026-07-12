/*
  Atomic direct-order persistence with idempotency keys.
  service_role only — Edge Functions call this after server-side validation/pricing.
*/

BEGIN;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS client_request_id uuid,
  ADD COLUMN IF NOT EXISTS client_request_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sales_source_client_request_id
  ON public.sales (source, client_request_id)
  WHERE client_request_id IS NOT NULL;

COMMENT ON COLUMN public.sales.client_request_id IS
  'Client-generated UUID reused on checkout retries for the same attempt.';
COMMENT ON COLUMN public.sales.client_request_hash IS
  'SHA-256 of normalized checkout payload; detects idempotency key reuse with different cart.';

CREATE OR REPLACE FUNCTION public.persist_direct_order(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source text;
  v_request_id uuid;
  v_request_hash text;
  v_sale jsonb;
  v_lines jsonb;
  v_existing record;
  v_daily int;
  v_display text;
  v_sale_id uuid;
  v_line jsonb;
  v_sale_item_id uuid;
  v_mod jsonb;
  v_item_count int := 0;
  v_qty int;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_PAYLOAD' USING ERRCODE = 'P0001';
  END IF;

  v_source := NULLIF(trim(p_payload->>'source'), '');
  v_request_id := NULLIF(p_payload->>'client_request_id', '')::uuid;
  v_request_hash := NULLIF(trim(p_payload->>'client_request_hash'), '');
  v_sale := p_payload->'sale';
  v_lines := p_payload->'lines';

  IF v_source IS NULL OR v_source NOT IN ('kiosk', 'online_delivery', 'online_takeaway') THEN
    RAISE EXCEPTION 'INVALID_SOURCE' USING ERRCODE = 'P0001';
  END IF;

  IF v_request_id IS NULL OR v_request_hash IS NULL OR length(v_request_hash) < 32 THEN
    RAISE EXCEPTION 'REQUEST_IDENTITY_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF v_sale IS NULL OR jsonb_typeof(v_sale) <> 'object' THEN
    RAISE EXCEPTION 'SALE_PAYLOAD_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  IF v_lines IS NULL OR jsonb_typeof(v_lines) <> 'array' OR jsonb_array_length(v_lines) < 1 THEN
    RAISE EXCEPTION 'LINES_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    s.id,
    s.client_request_hash,
    s.track_token,
    s.payment_init_token,
    s.display_number,
    s.daily_order_number,
    s.total_price
  INTO v_existing
  FROM sales s
  WHERE s.source = v_source
    AND s.client_request_id = v_request_id
  LIMIT 1;

  IF FOUND THEN
    IF coalesce(v_existing.client_request_hash, '') = v_request_hash THEN
      RETURN jsonb_build_object(
        'idempotent', true,
        'sale_id', v_existing.id,
        'track_token', v_existing.track_token,
        'payment_init_token', v_existing.payment_init_token,
        'display_number', v_existing.display_number,
        'daily_order_number', v_existing.daily_order_number,
        'total_price', v_existing.total_price
      );
    END IF;
    RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001';
  END IF;

  FOR v_line IN SELECT value FROM jsonb_array_elements(v_lines) LOOP
    v_qty := floor(coalesce((v_line->>'quantity')::numeric, 0));
    IF v_qty < 1 OR v_qty > 20 THEN
      RAISE EXCEPTION 'INVALID_LINE_QUANTITY' USING ERRCODE = 'P0001';
    END IF;
    v_item_count := v_item_count + v_qty;
  END LOOP;

  IF v_item_count < 1 OR v_item_count > 99 THEN
    RAISE EXCEPTION 'CART_ITEM_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_array_length(v_lines) > 40 THEN
    RAISE EXCEPTION 'CART_LINE_LIMIT' USING ERRCODE = 'P0001';
  END IF;

  SELECT d.daily_order_number, d.display_number
  INTO v_daily, v_display
  FROM allocate_direct_display_number() AS d(daily_order_number int, display_number text);

  IF v_daily IS NULL OR v_display IS NULL THEN
    RAISE EXCEPTION 'ORDER_NUMBER_FAILED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO sales (
    source,
    order_status,
    payment_status,
    sales_channel_id,
    total_price,
    quantity,
    unit_price,
    daily_order_number,
    display_number,
    track_token,
    payment_init_token,
    is_scheduled,
    scheduled_for,
    sale_date,
    notes,
    delivery_notes,
    online_payment_method,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_apartment,
    delivery_floor,
    delivery_lat,
    delivery_lng,
    delivery_fee,
    delivery_zone_id,
    customer_user_id,
    discount_amount,
    tip_amount,
    promo_code,
    client_request_id,
    client_request_hash
  )
  VALUES (
    v_source,
    coalesce(v_sale->>'order_status', 'pending'),
    coalesce(v_sale->>'payment_status', 'unpaid'),
    NULLIF(v_sale->>'sales_channel_id', '')::uuid,
    (v_sale->>'total_price')::numeric,
    (v_sale->>'quantity')::int,
    (v_sale->>'unit_price')::numeric,
    v_daily,
    v_display,
    NULLIF(v_sale->>'track_token', '')::uuid,
    NULLIF(v_sale->>'payment_init_token', '')::uuid,
    coalesce((v_sale->>'is_scheduled')::boolean, false),
    NULLIF(v_sale->>'scheduled_for', '')::timestamptz,
    coalesce(NULLIF(v_sale->>'sale_date', '')::timestamptz, now()),
    coalesce(v_sale->>'notes', ''),
    NULLIF(v_sale->>'delivery_notes', ''),
    NULLIF(v_sale->>'online_payment_method', ''),
    NULLIF(v_sale->>'customer_name', ''),
    NULLIF(v_sale->>'customer_phone', ''),
    NULLIF(v_sale->>'delivery_address', ''),
    NULLIF(v_sale->>'delivery_apartment', ''),
    NULLIF(v_sale->>'delivery_floor', ''),
    NULLIF(v_sale->>'delivery_lat', '')::double precision,
    NULLIF(v_sale->>'delivery_lng', '')::double precision,
    coalesce((v_sale->>'delivery_fee')::numeric, 0),
    NULLIF(v_sale->>'delivery_zone_id', '')::uuid,
    NULLIF(v_sale->>'customer_user_id', '')::uuid,
    coalesce((v_sale->>'discount_amount')::numeric, 0),
    coalesce((v_sale->>'tip_amount')::numeric, 0),
    NULLIF(v_sale->>'promo_code', ''),
    v_request_id,
    v_request_hash
  )
  RETURNING id INTO v_sale_id;

  FOR v_line IN SELECT value FROM jsonb_array_elements(v_lines) LOOP
    v_qty := floor(coalesce((v_line->>'quantity')::numeric, 0));

    INSERT INTO sale_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      total_price,
      notes,
      is_combo,
      combo_id,
      combo_selections
    )
    VALUES (
      v_sale_id,
      NULLIF(v_line->>'product_id', '')::uuid,
      coalesce(v_line->>'product_name', ''),
      v_qty,
      (v_line->>'unit_price')::numeric,
      (v_line->>'total_price')::numeric,
      NULLIF(v_line->>'notes', ''),
      coalesce((v_line->>'is_combo')::boolean, false),
      NULLIF(v_line->>'combo_id', '')::uuid,
      CASE
        WHEN v_line ? 'combo_selections' AND v_line->'combo_selections' IS NOT NULL
          THEN v_line->'combo_selections'
        ELSE NULL
      END
    )
    RETURNING id INTO v_sale_item_id;

    IF v_line ? 'modifiers' AND jsonb_typeof(v_line->'modifiers') = 'array' THEN
      FOR v_mod IN SELECT value FROM jsonb_array_elements(v_line->'modifiers') LOOP
        INSERT INTO sale_item_modifiers (
          sale_item_id,
          modifier_group_name,
          modifier_option_name,
          price_adjustment
        )
        VALUES (
          v_sale_item_id,
          coalesce(v_mod->>'modifier_group_name', ''),
          coalesce(v_mod->>'modifier_option_name', ''),
          coalesce((v_mod->>'price_adjustment')::numeric, 0)
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'idempotent', false,
    'sale_id', v_sale_id,
    'track_token', v_sale->>'track_token',
    'payment_init_token', v_sale->>'payment_init_token',
    'display_number', v_display,
    'daily_order_number', v_daily,
    'total_price', (v_sale->>'total_price')::numeric
  );
END;
$$;

COMMENT ON FUNCTION public.persist_direct_order(jsonb) IS
  'Atomically persists a direct kiosk/online order with idempotency; service_role only.';

REVOKE ALL ON FUNCTION public.persist_direct_order(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.persist_direct_order(jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.persist_direct_order(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.persist_direct_order(jsonb) TO service_role;

COMMIT;
