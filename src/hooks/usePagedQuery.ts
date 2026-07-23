import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LIST_PAGE_SIZE,
  fetchPage,
  mergeById,
  type PaginatedQuery,
} from '../lib/supabasePaginate';

type UsePagedQueryOptions = {
  buildQuery: () => PaginatedQuery;
  pageSize?: number;
  /** When false, skip automatic reload. Default true. */
  enabled?: boolean;
  /**
   * Reset and reload when these change (e.g. date range, tab).
   * Pass a stable serialized key or primitive deps.
   */
  deps?: unknown[];
};

export function usePagedQuery<T extends { id: string }>(options: UsePagedQueryOptions) {
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const enabled = options.enabled !== false;
  const depsKey = JSON.stringify(options.deps ?? []);

  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const offsetRef = useRef(0);
  const buildQueryRef = useRef(options.buildQuery);
  buildQueryRef.current = options.buildQuery;
  const inFlightMore = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    offsetRef.current = 0;
    const res = await fetchPage<T>(buildQueryRef.current, { offset: 0, pageSize });
    if (!mounted.current) return;
    if (res.error) {
      setError(res.error.message);
      setRows([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    setRows(res.data);
    setHasMore(res.hasMore);
    offsetRef.current = res.data.length;
    setLoading(false);
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || inFlightMore.current) return;
    inFlightMore.current = true;
    setLoadingMore(true);
    const res = await fetchPage<T>(buildQueryRef.current, {
      offset: offsetRef.current,
      pageSize,
    });
    if (!mounted.current) {
      inFlightMore.current = false;
      return;
    }
    if (res.error) {
      setError(res.error.message);
      setLoadingMore(false);
      inFlightMore.current = false;
      return;
    }
    setRows((prev) => {
      const merged = mergeById(prev, res.data);
      offsetRef.current = merged.length;
      return merged;
    });
    setHasMore(res.hasMore);
    setLoadingMore(false);
    inFlightMore.current = false;
  }, [hasMore, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, depsKey, reload]);

  return {
    rows,
    setRows,
    loading,
    loadingMore,
    error,
    hasMore,
    reload,
    loadMore,
  };
}
