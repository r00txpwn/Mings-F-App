/*
  # Add Menu Category Policy

  1. Security
    - Add anon SELECT policy on master_categories for menu type
    - This needs to be in a separate migration because the 'menu' enum value
      must be committed before it can be used in a policy
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'master_categories' AND policyname = 'Anon can read menu categories'
  ) THEN
    CREATE POLICY "Anon can read menu categories"
      ON master_categories FOR SELECT
      TO anon
      USING (type = 'menu');
  END IF;
END $$;
