import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  widthClassName?: string;
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
        className={`relative w-full ${widthClassName} max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-900`}
      >
        {children}
      </div>
    </div>
  );
}
