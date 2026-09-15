/**
 * Compare secrets via SHA-256 digests so unequal lengths don't short-circuit.
 * Safe to unit-test from Vitest (Web Crypto; no Deno).
 */
export async function timingSafeEqualString(a: string, b: string): Promise<boolean> {
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
