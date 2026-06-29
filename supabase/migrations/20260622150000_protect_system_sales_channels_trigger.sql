/*

  # Block soft-delete / deactivation of required system sales channels



  Enforces at the database layer (service role, admin-api, and direct client updates).

  Matches Wolt, Bolt, Kiosk, Online, POS by canonical id or normalized name.

*/



CREATE OR REPLACE FUNCTION public.is_system_sales_channel(p_id uuid, p_name text)

RETURNS boolean

LANGUAGE sql

IMMUTABLE

AS $$

  SELECT

    p_id IN (

      '59e8f2ea-dd1b-4096-808a-f0026b3cc643'::uuid,

      '27571bbe-fadb-48e2-be17-bf71f46ac9e3'::uuid,

      '93bd81cf-6034-45cd-9b0d-85d4f5c3cacc'::uuid,

      'f91273ac-b4b8-402a-bbb3-d356d64a4459'::uuid,

      '7e9a2c4b-8d1f-4a3e-b6c5-0d1e2f3a4b5c'::uuid

    )

    OR lower(trim(coalesce(p_name, ''))) IN ('kiosk', 'online', 'pos', 'wolt', 'bolt', 'bolt food')

    OR lower(trim(coalesce(p_name, ''))) LIKE 'wolt %'

    OR lower(trim(coalesce(p_name, ''))) LIKE 'bolt %';

$$;



CREATE OR REPLACE FUNCTION public.guard_system_sales_channel_mutation()

RETURNS trigger

LANGUAGE plpgsql

AS $$

BEGIN

  IF TG_OP = 'DELETE' THEN

    IF public.is_system_sales_channel(OLD.id, OLD.name) THEN

      RAISE EXCEPTION 'SYSTEM_CHANNEL_PROTECTED: required sales channel cannot be removed';

    END IF;

    RETURN OLD;

  END IF;



  IF TG_OP = 'UPDATE' AND public.is_system_sales_channel(OLD.id, OLD.name) THEN

    IF NEW.is_deleted IS DISTINCT FROM OLD.is_deleted AND NEW.is_deleted = true THEN

      RAISE EXCEPTION 'SYSTEM_CHANNEL_PROTECTED: required sales channel cannot be removed';

    END IF;

    IF NEW.is_active IS DISTINCT FROM OLD.is_active AND NEW.is_active = false THEN

      RAISE EXCEPTION 'SYSTEM_CHANNEL_PROTECTED: required sales channel cannot be deactivated';

    END IF;

    IF lower(trim(NEW.name)) IS DISTINCT FROM lower(trim(OLD.name)) THEN

      RAISE EXCEPTION 'SYSTEM_CHANNEL_PROTECTED: required sales channel cannot be renamed';

    END IF;

  END IF;



  RETURN NEW;

END;

$$;



DROP TRIGGER IF EXISTS guard_system_sales_channels ON public.sales_channels;



CREATE TRIGGER guard_system_sales_channels

  BEFORE UPDATE OR DELETE ON public.sales_channels

  FOR EACH ROW

  EXECUTE FUNCTION public.guard_system_sales_channel_mutation();



-- Heal any system rows that were soft-deleted before this trigger existed.

UPDATE public.sales_channels

SET

  is_deleted = false,

  is_active = true

WHERE public.is_system_sales_channel(id, name)

  AND (is_deleted = true OR is_active = false);


