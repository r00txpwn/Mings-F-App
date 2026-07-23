import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type ListPagerFooterProps = {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  /** When true, intersecting the sentinel auto-calls onLoadMore. Default true. */
  autoLoad?: boolean;
  className?: string;
};

/**
 * Load-more control + optional infinite-scroll sentinel for paged cockpit lists.
 */
export function ListPagerFooter({
  hasMore,
  loadingMore,
  onLoadMore,
  autoLoad = true,
  className = '',
}: ListPagerFooterProps) {
  const { t } = useLanguage();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoLoad || !hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: '120px', threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoLoad, hasMore, loadingMore, onLoadMore]);

  if (!hasMore && !loadingMore) {
    return (
      <div className={`py-3 text-center text-xs text-slate-500 dark:text-slate-400 ${className}`}>
        {t.endOfList}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
      <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loadingMore || !hasMore}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {loadingMore ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.loadingMore}
          </>
        ) : (
          t.loadMore
        )}
      </button>
    </div>
  );
}
