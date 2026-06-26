/*
  # Deduplicate system sales channels (e.g. duplicate POS rows)

  Earlier heal migration re-activated legacy POS rows instead of merging them.
  Reassigns sales/payouts to canonical ids, then soft-deletes duplicate rows.
*/

ALTER TABLE public.sales_channels DISABLE TRIGGER guard_system_sales_channels;

DO $$
DECLARE
  pair RECORD;
  canonical_id uuid;
  dupe_id uuid;
BEGIN
  FOR pair IN
    SELECT *
    FROM (VALUES
      ('59e8f2ea-dd1b-4096-808a-f0026b3cc643'::uuid, 'online'),
      ('27571bbe-fadb-48e2-be17-bf71f46ac9e3'::uuid, 'kiosk'),
      ('93bd81cf-6034-45cd-9b0d-85d4f5c3cacc'::uuid, 'wolt'),
      ('f91273ac-b4b8-402a-bbb3-d356d64a4459'::uuid, 'bolt'),
      ('7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c'::uuid, 'pos')
    ) AS t(canonical_id, normalized_name)
  LOOP
    canonical_id := pair.canonical_id;

    FOR dupe_id IN
      SELECT sc.id
      FROM public.sales_channels sc
      WHERE sc.id <> canonical_id
        AND sc.is_deleted = false
        AND (
          (pair.normalized_name = 'wolt' AND lower(trim(sc.name)) ~ '^(wolt)(\s|$)')
          OR (pair.normalized_name = 'bolt' AND (lower(trim(sc.name)) ~ '^(bolt)(\s|$)' OR lower(trim(sc.name)) = 'bolt food'))
          OR (pair.normalized_name IN ('kiosk', 'online', 'pos') AND lower(trim(sc.name)) = pair.normalized_name)
        )
    LOOP
      UPDATE public.sales
      SET sales_channel_id = canonical_id
      WHERE sales_channel_id = dupe_id;

      UPDATE public.platform_payouts
      SET sales_channel_id = canonical_id
      WHERE sales_channel_id = dupe_id;

      UPDATE public.sales_channels
      SET is_deleted = true, is_active = false
      WHERE id = dupe_id;
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.sales_channels ENABLE TRIGGER guard_system_sales_channels;
