/**
 * Shared auth + capability allowlist for the Hermes / agent-ops Edge Function.
 * Bearer AGENT_API_KEY; capabilities from AGENT_CAPABILITIES (comma-separated).
 *
 * Server-to-server only: requests with a browser `Origin` header are rejected.
 */
import { corsHeaders, jsonResponse } from './cors.ts';

export type AgentCapability =
  | 'sales_read'
  | 'analytics_read'
  | 'expenses_rw';

export const ALL_AGENT_CAPABILITIES: AgentCapability[] = [
  'sales_read',
  'analytics_read',
  'expenses_rw',
];

const CAPABILITY_SET = new Set<string>(ALL_AGENT_CAPABILITIES);

export { corsHeaders, jsonResponse };

/** Compare secrets via SHA-256 digests so unequal lengths don't short-circuit. */
async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const ua = new Uint8Array(ha);
  const ub = new Uint8Array(hb);
  if (ua.length !== ub.length) return false;
  let out = 0;
  for (let i = 0; i < ua.length; i++) out |= ua[i] ^ ub[i];
  return out === 0;
}

function readBearerSecret(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!h?.toLowerCase().startsWith('bearer ')) return null;
  const token = h.slice(7).trim();
  return token.length ? token : null;
}

/** Parse AGENT_CAPABILITIES env (comma-separated). Unknown tokens ignored. */
export function parseAgentCapabilities(raw: string | undefined | null): Set<AgentCapability> {
  const out = new Set<AgentCapability>();
  if (!raw?.trim()) return out;
  for (const part of raw.split(',')) {
    const token = part.trim().toLowerCase();
    if (CAPABILITY_SET.has(token)) out.add(token as AgentCapability);
  }
  return out;
}

/**
 * Reject browser calls. Hermes/MCP/curl do not send Origin.
 * OPTIONS is handled by the caller before this runs.
 */
export function rejectBrowserOrigin(req: Request): Response | null {
  const origin = req.headers.get('Origin') ?? req.headers.get('origin');
  if (origin != null && origin !== '') {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'BROWSER_FORBIDDEN',
          message: 'agent-ops is server-to-server only (no browser Origin)',
        },
      },
      403
    );
  }
  return null;
}

export async function requireAgentAuth(
  req: Request
): Promise<{ ok: true; capabilities: Set<AgentCapability> } | Response> {
  const browser = rejectBrowserOrigin(req);
  if (browser) return browser;

  const expected = (Deno.env.get('AGENT_API_KEY') ?? '').trim();
  if (!expected) {
    return jsonResponse(
      { ok: false, error: { code: 'MISCONFIGURED', message: 'AGENT_API_KEY is not set' } },
      503
    );
  }

  const got = readBearerSecret(req);
  // Always hash-compare against expected so missing Bearer still does similar work.
  const matches = await timingSafeEqualString(got ?? '', expected);
  if (!matches) {
    return jsonResponse(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing agent key' } },
      401
    );
  }

  const capabilities = parseAgentCapabilities(Deno.env.get('AGENT_CAPABILITIES'));
  return { ok: true, capabilities };
}

export function requireCapability(
  capabilities: Set<AgentCapability>,
  needed: AgentCapability
): Response | null {
  if (capabilities.has(needed)) return null;
  return jsonResponse(
    {
      ok: false,
      error: {
        code: 'CAPABILITY_DENIED',
        message: `Capability "${needed}" is not enabled. Set AGENT_CAPABILITIES to include it.`,
        enabled: [...capabilities],
      },
    },
    403
  );
}
