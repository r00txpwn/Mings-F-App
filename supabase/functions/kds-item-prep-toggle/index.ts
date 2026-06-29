import {
  isKitchenQueueSource,
  KITCHEN_QUEUE_STATUSES,
} from '../_shared/kitchenSources.ts';
import { corsHeaders, jsonResponse, requireStaffAuth, writeAdminAudit } from '../_shared/staffAuth.ts';

interface PrepBody {
  saleItemId: string;
  prepared: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  const auth = await requireStaffAuth(req);
  if (auth instanceof Response) return auth;
  const { user, role, supabaseAdmin } = auth;

  let body: PrepBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, 400);
  }

  const { saleItemId, prepared } = body;
  if (!saleItemId || typeof prepared !== 'boolean') {
    return jsonResponse({ ok: false, error: { code: 'BAD_REQUEST', message: 'Invalid saleItemId or prepared' } }, 400);
  }

  const { data: item, error: loadErr } = await supabaseAdmin
    .from('sale_items')
    .select('id, sale_id')
    .eq('id', saleItemId)
    .maybeSingle();

  if (loadErr || !item) {
    return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Sale item not found' } }, 404);
  }

  const { data: sale, error: saleErr } = await supabaseAdmin
    .from('sales')
    .select('id, source, order_status')
    .eq('id', item.sale_id)
    .maybeSingle();

  if (saleErr || !sale) {
    return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } }, 404);
  }

  const row = sale as { source: string | null; order_status: string | null };
  if (!isKitchenQueueSource(row.source)) {
    return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Not a kitchen queue item' } }, 403);
  }
  if (!row.order_status || !(KITCHEN_QUEUE_STATUSES as readonly string[]).includes(row.order_status)) {
    return jsonResponse({ ok: false, error: { code: 'INVALID_STATE', message: 'Order not on kitchen board' } }, 400);
  }

  const preparedAt = prepared ? new Date().toISOString() : null;
  const { data, error } = await supabaseAdmin
    .from('sale_items')
    .update({ prepared_at: preparedAt })
    .eq('id', saleItemId)
    .select('id, prepared_at')
    .maybeSingle();

  if (error) {
    return jsonResponse({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, 400);
  }

  await writeAdminAudit(supabaseAdmin, {
    actorId: user.id,
    actorRole: role,
    action: 'kds_item_prep_toggle',
    resourceTable: 'sale_items',
    resourceId: saleItemId,
    payload: { prepared, saleId: item.sale_id },
  });

  return jsonResponse({ ok: true, data });
});
