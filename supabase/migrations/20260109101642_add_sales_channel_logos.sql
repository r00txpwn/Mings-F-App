/*
  # Add Logo Support to Sales Channels

  1. Changes
    - Add `logo_url` column to sales_channels table to store image paths
    - Add `display_order` column to control channel ordering in UI
    - Update existing channels with logo URLs for Wolt, Bolt, and ChoiceQR
    - Keep Offline and Other channels with emoji icons (no logo)

  2. Logo Mapping
    - Wolt: /images/files_8280743-1767952948439-image.png
    - Bolt Food: /images/files_8280743-1767952981144-image.png
    - ChoiceQR: /images/files_8280743-1767953019500-image.png
    - Offline: No logo (uses emoji)
    - Other: No logo (uses emoji)
*/

-- Add logo_url column to sales_channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_channels' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE sales_channels ADD COLUMN logo_url text;
  END IF;
END $$;

-- Add display_order column to sales_channels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_channels' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE sales_channels ADD COLUMN display_order integer DEFAULT 999;
  END IF;
END $$;

-- Update channels with logos and display order
UPDATE sales_channels 
SET 
  logo_url = '/images/files_8280743-1767952948439-image.png',
  display_order = 1
WHERE name = 'Wolt';

UPDATE sales_channels 
SET 
  logo_url = '/images/files_8280743-1767952981144-image.png',
  display_order = 2
WHERE name = 'Bolt Food';

UPDATE sales_channels 
SET 
  logo_url = '/images/files_8280743-1767953019500-image.png',
  display_order = 3
WHERE name = 'ChoiceQR';

UPDATE sales_channels 
SET display_order = 4
WHERE name = 'Offline';

UPDATE sales_channels 
SET display_order = 5
WHERE name = 'Other';