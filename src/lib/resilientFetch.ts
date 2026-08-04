/** Retry transient browser network failures (e.g. Failed to fetch / connection reset). */
export async function resilientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
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
