import { paymentConfirmedForKdsPrep } from '../_shared/onlinePaymentMethod.ts';
import { corsHeaders, jsonResponse, requireStaffAuth, writeAdminAudit } from '../_shared/staffAuth.ts';

interface StatusBody {
  saleId: string;
  nextStatus: string;
  prepMinutes?: number;
}

const ALLOWED_STATUSES = new Set(['preparing', 'ready', 'dispatched', 'completed', 'cancelled']);

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

  if (nextStatus === 'preparing') {
    const { data: sale, error: loadErr } = await supabaseAdmin
      .from('sales')
      .select('id, source, online_payment_method, payment_status, order_status')
      .eq('id', saleId)
      .maybeSingle();
    if (loadErr || !sale) {
      return jsonResponse({ ok: false, error: { code: 'NOT_FOUND', message: 'Sale not found' } }, 404);
    }
    const row = sale as {
      source: string | null;
      online_payment_method: string | null;
      payment_status: string | null;
      order_status: string | null;
    };
    if (row.order_status !== 'pending') {
      return jsonResponse(
        { ok: false, error: { code: 'INVALID_STATE', message: 'Only pending orders can start preparing' } },
        400
      );
    }
    if (
      !paymentConfirmedForKdsPrep({
        source: row.source,
        onlinePaymentMethod: row.online_payment_method,
        paymentStatus: row.payment_status,
      })
    ) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: 'PAYMENT_NOT_CONFIRMED',
            message: 'Card payment must be confirmed before preparing',
          },
        },
        409
      );
    }
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

  const { data, error } = await supabaseAdmin
    .from('sales')
    .update(updates)
    .eq('id', saleId)
    .select('id, order_status')
    .maybeSingle();

  if (error) {
    return jsonResponse({ ok: false, error: { code: 'DB_ERROR', message: error.message } }, 400);
  }

  if (nextStatus === 'preparing') {
    await supabaseAdmin
      .from('sale_items')
      .update({ prepared_at: null })
      .eq('sale_id', saleId);
  }

  await writeAdminAudit(supabaseAdmin, {
    actorId: user.id,
    actorRole: role,
    action: 'kds_status_update',
    resourceTable: 'sales',
    resourceId: saleId,
    payload: { nextStatus, prepMinutes },
  });

  return jsonResponse({ ok: true, data });
});
