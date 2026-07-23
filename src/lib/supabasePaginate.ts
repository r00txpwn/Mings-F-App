import type { PostgrestError } from '@supabase/supabase-js';

const FETCH_ALL_PAGE_SIZE = 1000;

/** Default page size for cockpit history lists (Load more / infinite scroll). */
export const LIST_PAGE_SIZE = 50;

export type PaginatedQuery = {
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
    const { data, error } = await buildQuery().range(offset, offset + FETCH_ALL_PAGE_SIZE - 1);
    if (error) {
      return { data: [], error };
    }
    const page = (data ?? []) as T[];
    all.push(...page);
    if (page.length < FETCH_ALL_PAGE_SIZE) {
      break;
    }
    offset += FETCH_ALL_PAGE_SIZE;
  }

  return { data: all, error: null };
}

/** Fetch one page via `.range()`. `hasMore` is true when the page is full. */
export async function fetchPage<T>(
  buildQuery: () => PaginatedQuery,
  options: { offset: number; pageSize?: number },
): Promise<{ data: T[]; error: PostgrestError | null; hasMore: boolean }> {
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const { data, error } = await buildQuery().range(options.offset, options.offset + pageSize - 1);
  if (error) {
    return { data: [], error, hasMore: false };
  }
  const page = (data ?? []) as T[];
  return { data: page, error: null, hasMore: page.length >= pageSize };
}

/** Append pages while skipping duplicate ids (rows can shift between fetches). */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return existing;
  const seen = new Set(existing.map((row) => row.id));
  const merged = [...existing];
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged;
}
