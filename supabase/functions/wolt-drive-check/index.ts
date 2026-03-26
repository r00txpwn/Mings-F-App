import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { pointInGeoJsonPolygon } from '../_shared/geo.ts';

/** Validates pickup/dropoff config; optional Wolt API ping when WOLT_API_TOKEN is set. */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  let body: { lat?: number; lng?: number };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return jsonResponse({ error: 'lat and lng required' }, 400);
  }

  const { data: zones } = await supabase.from('delivery_zones').select('*').eq('is_active', true);
  let matched: { id: string; name: string; delivery_fee: number; min_order_amount: number } | null = null;
  for (const z of zones ?? []) {
    const poly = z.polygon as { type?: string; coordinates?: number[][][] };
    if (pointInGeoJsonPolygon(lng, lat, poly)) {
      matched = {
        id: z.id as string,
        name: z.name as string,
        delivery_fee: Number(z.delivery_fee ?? 0),
        min_order_amount: Number(z.min_order_amount ?? 0),
      };
      break;
    }
  }

  const woltToken = Deno.env.get('WOLT_API_TOKEN');
  return jsonResponse({
    inZone: Boolean(matched),
    zone: matched,
    woltConfigured: Boolean(woltToken),
  });
});
