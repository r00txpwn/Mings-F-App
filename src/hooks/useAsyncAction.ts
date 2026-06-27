import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps an async action with a re-entry guard so rapid / double clicks cannot
 * trigger the action (and its DB writes) more than once while it is in flight.
 *
 * Returns the wrapped runner and a `pending` flag for disabling buttons / spinners.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): {
  run: (...args: TArgs) => Promise<TResult | undefined>;
  pending: boolean;
} {
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const actionRef = useRef(action);

  actionRef.current = action;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args: TArgs): Promise<TResult | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    if (mounted.current) setPending(true);
    try {
      return await actionRef.current(...args);
    } finally {
      inFlight.current = false;
      if (mounted.current) setPending(false);
    }
  }, []);

  return { run, pending };
}
