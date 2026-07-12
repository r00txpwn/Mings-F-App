import type { PostgrestError } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;

type PaginatedQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>;
};

/** Fetch all rows from a Supabase query that supports .range(), paginating past the 1000-row default cap. */
export async function fetchAllRows<T>(
  buildQuery: () => PaginatedQuery,
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery().range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      return { data: [], error };
    }
    const page = (data ?? []) as T[];
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return { data: all, error: null };
}
