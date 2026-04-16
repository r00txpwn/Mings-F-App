/**
 * Generates the Epoint API signature.
 * Formula: base64(sha1_raw(privateKey + data + privateKey))
 * SHA1 must produce raw binary (20 bytes), not hex — then base64 encoded.
 */
export async function epointSignature(privateKey: string, data: string): Promise<string> {
  const input = new TextEncoder().encode(privateKey + data + privateKey);
  const hashBuffer = await crypto.subtle.digest('SHA-1', input);
  const bytes = new Uint8Array(hashBuffer);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

/**
 * Encodes a JSON object as the Epoint `data` param: base64(JSON.stringify(obj)).
 */
export function epointData(obj: Record<string, unknown>): string {
  return btoa(JSON.stringify(obj));
}
