export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  /** Match Supabase client + browser preflight (Access-Control-Request-Headers). */
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, accept, accept-profile, content-profile, prefer, x-requested-with, baggage, sentry-trace, x-wolt-signature',
  'Access-Control-Max-Age': '86400',
};

/** CORS preflight for browser → Edge Function. 200 + body matches Supabase CORS docs. */
export function corsPreflightResponse(): Response {
  return new Response('ok', {
    status: 200,
    headers: corsHeaders,
  });
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
