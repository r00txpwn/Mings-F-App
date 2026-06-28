import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  widthClassName?: string;
  contentClassName?: string;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  /** When false, backdrop click and Escape do not call onClose. Default true. */
  allowClose?: boolean;
}

const FOCUSABLE =
  'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  titleId,
  children,
  widthClassName = 'max-w-lg',
  contentClassName = '',
  title,
  subtitle,
  showCloseButton = true,
  allowClose = true,
}: ModalProps) {
  const handleClose = () => {
    if (allowClose) onClose();
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    const root = rootRef.current;
    const firstFocusable = root?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (allowClose) onClose();
        return;
      }
      if (event.key !== 'Tab' || !root) return;

      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled')
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      restoreRef.current?.focus();
    };
  }, [allowClose, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full flex-col ${widthClassName} max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 ${contentClassName}`}
      >
        {title ? (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
            {showCloseButton ? (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
