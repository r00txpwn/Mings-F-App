import { AlertTriangle } from 'lucide-react';
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
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} titleId="confirm-dialog-title" widthClassName="max-w-md">
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
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="cockpit-btn-ghost">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              tone === 'danger'
                ? 'inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500'
                : 'cockpit-btn-primary'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
