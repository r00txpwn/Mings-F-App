-- Combo discount foundation fields (no pricing behavior change yet)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'combo_discount_type'
  ) THEN
    CREATE TYPE public.combo_discount_type AS ENUM ('percent', 'fixed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combo_deals' AND column_name = 'discount_enabled'
  ) THEN
    ALTER TABLE public.combo_deals
      ADD COLUMN discount_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combo_deals' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE public.combo_deals
      ADD COLUMN discount_type public.combo_discount_type NOT NULL DEFAULT 'fixed';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combo_deals' AND column_name = 'discount_value'
  ) THEN
    ALTER TABLE public.combo_deals
      ADD COLUMN discount_value numeric(12, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combo_deals' AND column_name = 'apply_discount_to_modifiers'
  ) THEN
    ALTER TABLE public.combo_deals
      ADD COLUMN apply_discount_to_modifiers boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'combo_deals_discount_value_non_negative'
      AND conrelid = 'public.combo_deals'::regclass
  ) THEN
    ALTER TABLE public.combo_deals
      ADD CONSTRAINT combo_deals_discount_value_non_negative CHECK (discount_value >= 0);
  END IF;
END $$;
