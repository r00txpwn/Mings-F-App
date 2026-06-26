import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'danger' | 'default';
  confirmLoading?: boolean;
  confirmLoadingLabel?: string;
  errorMessage?: string | null;
  disableClose?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  tone = 'danger',
  confirmLoading = false,
  confirmLoadingLabel,
  errorMessage = null,
  disableClose = false,
}: ConfirmDialogProps) {
  const locked = confirmLoading || disableClose;

  const handleCancel = () => {
    if (locked) return;
    onCancel();
  };

  const confirmButtonClass =
    tone === 'danger'
      ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60'
      : 'cockpit-btn-primary disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      titleId="confirm-dialog-title"
      widthClassName="max-w-md"
      allowClose={!locked}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              tone === 'danger'
                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300'
                : 'bg-cockpit-500/15 text-cockpit-600 dark:text-cockpit-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
            {errorMessage ? (
              <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={handleCancel} disabled={locked} className="cockpit-btn-ghost disabled:cursor-not-allowed disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={confirmLoading} className={confirmButtonClass}>
            {confirmLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {confirmLoadingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
