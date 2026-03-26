/*
  # Remove Offline/Takeaway sales channel

  Deletes the channel named `Offline/Takeaway` and the legacy seed name `Offline`
  (same physical channel in older migrations). Clears dependent rows first:

  - platform_payouts (FK does not cascade)
  - sales.sales_channel_id (explicit NULL for safety across FK variants)
  - transactions.channel_id when that column exists
*/

DELETE FROM public.platform_payouts
WHERE sales_channel_id IN (
  SELECT id FROM public.sales_channels
  WHERE name IN ('Offline/Takeaway', 'Offline')
);

UPDATE public.sales
SET sales_channel_id = NULL
WHERE sales_channel_id IN (
  SELECT id FROM public.sales_channels
  WHERE name IN ('Offline/Takeaway', 'Offline')
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'channel_id'
  ) THEN
    UPDATE public.transactions
    SET channel_id = NULL
    WHERE channel_id IN (
      SELECT id FROM public.sales_channels
      WHERE name IN ('Offline/Takeaway', 'Offline')
    );
  END IF;
END $$;

DELETE FROM public.sales_channels
WHERE name IN ('Offline/Takeaway', 'Offline');
