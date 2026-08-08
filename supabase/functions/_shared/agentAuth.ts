/**
 * Shared auth + capability allowlist for the Hermes / agent-ops Edge Function.
 * Bearer AGENT_API_KEY; capabilities from AGENT_CAPABILITIES (comma-separated).
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

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function readBearerSecret(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!h?.toLowerCase().startsWith('bearer ')) return null;
  return h.slice(7).trim();
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

export function requireAgentAuth(
  req: Request
): { ok: true; capabilities: Set<AgentCapability> } | Response {
  const expected = (Deno.env.get('AGENT_API_KEY') ?? '').trim();
  if (!expected) {
    return jsonResponse(
      { ok: false, error: { code: 'MISCONFIGURED', message: 'AGENT_API_KEY is not set' } },
      503
    );
  }

  const got = readBearerSecret(req);
  if (got == null || !timingSafeEqualString(got, expected)) {
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
