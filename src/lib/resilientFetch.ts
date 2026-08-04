/** Methods safe to auto-retry on transient network failure. */
function isRetrySafeMethod(method: string | undefined): boolean {
  const m = (method ?? 'GET').toUpperCase();
  return m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
}

/**
 * Retry transient browser network failures (e.g. Failed to fetch / connection reset).
 * Never retries mutations: if the server already committed, a blind POST retry would duplicate rows
 * (e.g. supplier clear-debt under flaky HTTP2).
 */
export async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!isRetrySafeMethod(init?.method)) {
    return fetch(input, init);
  }

  const maxAttempts = 3;
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 350 * 2 ** attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Network error');
}
