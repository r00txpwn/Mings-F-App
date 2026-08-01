import { describe, expect, it, vi } from 'vitest';
import { withOptimisticState } from '../../src/lib/optimisticUpdate';

describe('withOptimisticState', () => {
  it('applies next state then keeps it on success', async () => {
    let state = [1, 2];
    const setState = vi.fn((next: number[]) => {
      state = next;
    });

    const err = await withOptimisticState({
      getPrevious: () => state,
      setState,
      nextState: (prev) => [...prev, 3],
      persist: async () => ({ ok: true, data: { id: 'x' } }),
    });

    expect(err).toBeNull();
    expect(state).toEqual([1, 2, 3]);
    expect(setState).toHaveBeenCalledTimes(1);
  });

  it('rolls back on persist failure', async () => {
    let state = ['a'];
    const setState = (next: string[]) => {
      state = next;
    };

    const err = await withOptimisticState({
      getPrevious: () => state,
      setState,
      nextState: () => ['a', 'b'],
      persist: async () => ({ ok: false, error: 'boom' }),
    });

    expect(err).toBe('boom');
    expect(state).toEqual(['a']);
  });

  it('can commit server id after insert', async () => {
    let state = [{ id: 'temp-1', n: 1 }];
    const setState = (next: typeof state) => {
      state = next;
    };

    const err = await withOptimisticState({
      getPrevious: () => state,
      setState,
      nextState: (prev) => prev,
      persist: async () => ({ ok: true, data: { id: 'real-9' } }),
      commit: (server, applied) =>
        applied.map((row) => (row.id === 'temp-1' ? { ...row, id: (server as { id: string }).id } : row)),
    });

    expect(err).toBeNull();
    expect(state).toEqual([{ id: 'real-9', n: 1 }]);
  });
});
