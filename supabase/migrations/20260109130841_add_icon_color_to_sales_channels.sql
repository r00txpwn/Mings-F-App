/*
  # Add icon and color columns to sales_channels

  ## Changes
    - Add `icon` column to sales_channels table for visual representation
    - Add `color` column to sales_channels table for UI theming
    - Update existing sales channels with default values

  ## Security
    - No changes to RLS policies needed
*/

-- Add icon and color columns to sales_channels
ALTER TABLE sales_channels
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'store',
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';

-- Update existing sales channels with meaningful icons and colors
UPDATE sales_channels SET icon = '🚗', color = '#10B981' WHERE name = 'Bolt';
UPDATE sales_channels SET icon = '📱', color = '#F59E0B' WHERE name = 'ChoiceQR';
UPDATE sales_channels SET icon = '🛵', color = '#00C2E8' WHERE name = 'Wolt';
UPDATE sales_channels SET icon = '🏪', color = '#6B7280' WHERE name = 'Offline/Takeaway';
