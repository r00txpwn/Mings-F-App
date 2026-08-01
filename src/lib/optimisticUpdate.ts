/**
 * Snapshot-based optimistic update: apply next state immediately, persist, rollback on error.
 * Prefer this over mutate → full reload + skeleton flash (see ExpensesScreen, StaffScreen).
 *
 * Usage:
 *   const err = await withOptimisticState({
 *     getPrevious: () => items,
 *     setState: setItems,
 *     nextState: (prev) => [...prev, pending],
 *     persist: () => adminInsert('table', payload),
 *     commit: (server) => // optional: replace temp id
 *   });
 *   if (err) toast.error(err);
 */
export async function withOptimisticState<TState, TResult = unknown>(options: {
  getPrevious: () => TState;
  setState: (next: TState) => void;
  nextState: (previous: TState) => TState;
  persist: () => Promise<{ ok: boolean; data?: TResult | null; error?: string }>;
  /** Optional: derive final state from server row (e.g. replace temp id). */
  commit?: (serverData: TResult | null | undefined, applied: TState) => TState | void;
}): Promise<string | null> {
  const previous = options.getPrevious();
  const applied = options.nextState(previous);
  options.setState(applied);

  const result = await options.persist();
  if (!result.ok) {
    options.setState(previous);
    return result.error ?? 'Request failed';
  }

  if (options.commit) {
    const committed = options.commit(result.data, applied);
    if (committed !== undefined) options.setState(committed);
  }
  return null;
}
