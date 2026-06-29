/*
  # Codify get_sale_tracking_public RPC (X-BUG-04)

  src/order/TrackingApp.tsx calls supabase.rpc('get_sale_tracking_public', { p_token })
  to power the public order-tracking page. The function exists in the live database
  (anon + authenticated have EXECUTE) but had no migration in repo history, so the
  repo and remote drifted and a fresh `supabase db reset` would break tracking.

  This migration re-creates the function exactly as it exists in production
  (SECURITY DEFINER, search_path = public) so repo == remote. It is idempotent.

  Security: only exposes online (delivery/takeaway) orders, requires an 8+ char
  track token, and returns null otherwise.
*/

CREATE OR REPLACE FUNCTION public.get_sale_tracking_public(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  result jsonb;
begin
  if p_token is null or char_length(trim(p_token)) < 8 then
    return null;
  end if;

  select jsonb_build_object(
    'sale', to_jsonb(s),
    'delivery', (
      select to_jsonb(d)
      from public.delivery_orders d
      where d.sale_id = s.id
      limit 1
    )
  )
  into result
  from public.sales s
  where s.track_token = trim(p_token)
    and s.source in ('online_delivery', 'online_takeaway')
  limit 1;

  return result;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.get_sale_tracking_public(text) TO anon, authenticated;
