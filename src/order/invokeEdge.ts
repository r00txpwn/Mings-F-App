const fnUrl = (name: string) =>
  `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/${name}`;

export async function invokeEdgeFunction<TBody extends object, TRes = unknown>(
  name: string,
  body: TBody,
  /** Customer JWT — when set, Edge links the sale to `customer_user_id`. */
  accessToken?: string | null
): Promise<{ ok: boolean; status: number; data: TRes | null; error?: string }> {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!key) {
    return { ok: false, status: 0, data: null, error: 'Missing anon key' };
  }
  const bearer = accessToken?.trim() ? accessToken.trim() : key;
  const res = await fetch(fnUrl(name), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearer}`,
      apikey: key,
      'x-client-info': 'mings-os-order',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as TRes | { error?: string } | null;
  if (!res.ok) {
    const err = json && typeof json === 'object' && json !== null && 'error' in json ? String((json as { error?: string }).error) : res.statusText;
    return { ok: false, status: res.status, data: null, error: err };
  }
  return { ok: true, status: res.status, data: json as TRes };
}
