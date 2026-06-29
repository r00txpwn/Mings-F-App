/**
 * Shared staff JWT validation for Edge Functions (cockpit / order-manager / KDS).
 */
import { createClient, type User } from 'npm:@supabase/supabase-js@2';

export type StaffRole = 'admin' | 'manager' | 'staff';

export interface StaffAuthResult {
  user: User;
  role: StaffRole;
  supabaseAdmin: ReturnType<typeof createClient>;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey, x-kds-secret',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export async function requireStaffAuth(
  req: Request,
  opts?: { minRole?: StaffRole[] }
): Promise<StaffAuthResult | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing authorization' } }, 401);
  }

  const token = authHeader.slice('Bearer '.length);
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid session' } }, 401);
  }

  const claimedRole = user.app_metadata?.role;
  let role: StaffRole | null = null;

  if (claimedRole === 'admin' || claimedRole === 'manager' || claimedRole === 'staff') {
    role = claimedRole;
  } else {
    const { data: row, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (roleError || !row?.role) {
      return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Staff access required' } }, 403);
    }
    const dbRole = row.role as string;
    if (dbRole === 'admin' || dbRole === 'manager' || dbRole === 'staff') {
      role = dbRole;
    }
  }

  if (!role) {
    return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Staff access required' } }, 403);
  }

  const allowed = opts?.minRole ?? ['admin', 'manager', 'staff'];
  if (!allowed.includes(role)) {
    return jsonResponse({ ok: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } }, 403);
  }

  return { user, role, supabaseAdmin };
}

export async function writeAdminAudit(
  supabaseAdmin: ReturnType<typeof createClient>,
  entry: {
    actorId: string | null;
    actorRole: string;
    action: string;
    resourceTable: string;
    resourceId?: string | null;
    payload?: unknown;
  }
): Promise<void> {
  await supabaseAdmin.from('admin_audit_log').insert({
    actor_id: entry.actorId,
    actor_role: entry.actorRole,
    action: entry.action,
    resource_table: entry.resourceTable,
    resource_id: entry.resourceId ?? null,
    payload: entry.payload ?? null,
  });
}
