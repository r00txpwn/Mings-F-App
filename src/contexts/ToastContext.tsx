import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  /** Auto-dismiss delay in ms. Defaults to 3500 (5000 for errors). */
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, 'durationMs'>> {
  id: number;
  durationMs: number;
  leaving: boolean;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((tt) => (tt.id === id ? { ...tt, leaving: true } : tt)));
    const exitTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((tt) => tt.id !== id));
      timers.current.delete(id);
    }, EXIT_MS);
    timers.current.set(id, exitTimer);
  }, []);

  const showToast = useCallback(
    ({ type = 'info', message, durationMs }: ToastOptions) => {
      if (!message) return;
      const id = ++idRef.current;
      const ttl = durationMs ?? (type === 'error' ? 5000 : 3500);
      setToasts((prev) => [...prev, { id, type, message, durationMs: ttl, leaving: false }]);
      const timer = setTimeout(() => removeToast(id), ttl);
      timers.current.set(id, timer);
    },
    [removeToast],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (message, durationMs) => showToast({ type: 'success', message, durationMs }),
      error: (message, durationMs) => showToast({ type: 'error', message, durationMs }),
      info: (message, durationMs) => showToast({ type: 'info', message, durationMs }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

const toneByType: Record<ToastType, { accent: string; iconWrap: string; icon: ReactNode }> = {
  success: {
    accent: 'from-emerald-600 via-emerald-500 to-teal-500',
    iconWrap: 'bg-emerald-500/15 text-emerald-400',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: {
    accent: 'from-rose-600 via-rose-500 to-orange-500',
    iconWrap: 'bg-rose-500/15 text-rose-400',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  info: {
    accent: 'from-cockpit-600 via-cockpit-500 to-cyan-500',
    iconWrap: 'bg-cockpit-500/15 text-cockpit-300',
    icon: <Info className="h-5 w-5" />,
  },
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(100%-2rem,420px)] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => {
        const tone = toneByType[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            className={`pointer-events-auto overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-all duration-200 ${
              toast.leaving ? 'translate-y-2 opacity-0' : 'animate-scaleIn opacity-100'
            }`}
          >
            <div className={`h-1 bg-gradient-to-r ${tone.accent}`} />
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}>
                  {tone.icon}
                </div>
                <p className="min-w-0 text-sm font-medium text-foreground">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
