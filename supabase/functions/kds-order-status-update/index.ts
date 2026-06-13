import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, writeAdminAudit } from '../_shared/staffAuth.ts';

interface StatusBody {
  saleId: string;
  nextStatus: string;
  prepMinutes?: number;
}

const ALLOWED_STATUSES = new Set(['preparing', 'ready', 'dispatched', 'completed', 'cancelled']);

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isKdsAuthorized(req: Request): boolean {
  const configured = (Deno.env.get('KDS_SECRET') ?? Deno.env.get('VITE_KDS_SECRET') ?? '').trim();
  if (!configured) return true;
  const provided = (req.headers.get('x-kds-secret') ?? '').trim();
  return provided === configured;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  if (!isKdsAuthorized(req)) {
    return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Invalid KDS secret' } }, 403);
  }

  let body: StatusBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400);
  }

  const { saleId, nextStatus, prepMinutes } = body;
  if (!saleId || !nextStatus || !ALLOWED_STATUSES.has(nextStatus)) {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid saleId or nextStatus' } }, 400);
  }

  const updates: Record<string, unknown> = { order_status: nextStatus };
  if (nextStatus === 'preparing') {
    updates.prep_started_at = new Date().toISOString();
    if (prepMinutes != null) {
      updates.estimated_ready_at = new Date(Date.now() + prepMinutes * 60_000).toISOString();
    }
  }
  if (nextStatus === 'ready') {
    updates.ready_at = new Date().toISOString();
  }

  const supabaseAdmin = getServiceClient();
  const { data, error } = await supabaseAdmin
    .from('sales')
    .update(updates)
    .eq('id', saleId)
    .select('id, order_status')
    .maybeSingle();

  if (error) {
    return jsonResponse({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, 400);
  }

  await writeAdminAudit(supabaseAdmin, {
    actorId: null,
    actorRole: 'kds',
    action: 'kds_status_update',
    resourceTable: 'sales',
    resourceId: saleId,
    payload: { nextStatus, prepMinutes },
  });

  return jsonResponse({ ok: true, data });
});
