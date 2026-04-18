-- Combo deals (bundled pricing) + sale_items flags + optional upsell hint on products

CREATE TABLE IF NOT EXISTS public.combo_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_price numeric(12, 2) NOT NULL CHECK (base_price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combo_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id uuid NOT NULL REFERENCES public.combo_deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  selection_type text NOT NULL DEFAULT 'single' CHECK (selection_type = 'single'),
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combo_groups_combo_id ON public.combo_groups(combo_id);

CREATE TABLE IF NOT EXISTS public.combo_group_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.combo_groups(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_adjustment numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_group_items_group ON public.combo_group_items(group_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'combo_upsell_eligible'
  ) THEN
    ALTER TABLE public.products ADD COLUMN combo_upsell_eligible boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'is_combo'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN is_combo boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'combo_id'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN combo_id uuid REFERENCES public.combo_deals(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'combo_selections'
  ) THEN
    ALTER TABLE public.sale_items ADD COLUMN combo_selections jsonb;
  END IF;
END $$;

ALTER TABLE public.combo_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_group_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active combo deals" ON public.combo_deals;
CREATE POLICY "Anyone can read active combo deals"
  ON public.combo_deals FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Staff can manage combo deals" ON public.combo_deals;
CREATE POLICY "Staff can manage combo deals"
  ON public.combo_deals FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Anyone can read combo groups for active combos" ON public.combo_groups;
CREATE POLICY "Anyone can read combo groups for active combos"
  ON public.combo_groups FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.combo_deals cd WHERE cd.id = combo_groups.combo_id AND cd.is_active = true)
  );

DROP POLICY IF EXISTS "Staff can manage combo groups" ON public.combo_groups;
CREATE POLICY "Staff can manage combo groups"
  ON public.combo_groups FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );

DROP POLICY IF EXISTS "Anyone can read combo group items for active combos" ON public.combo_group_items;
CREATE POLICY "Anyone can read combo group items for active combos"
  ON public.combo_group_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.combo_groups cg
      JOIN public.combo_deals cd ON cd.id = cg.combo_id
      WHERE cg.id = combo_group_items.group_id AND cd.is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can manage combo group items" ON public.combo_group_items;
CREATE POLICY "Staff can manage combo group items"
  ON public.combo_group_items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'staff'))
  );
