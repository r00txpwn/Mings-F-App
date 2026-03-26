interface DangerConfirmRowProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function DangerConfirmRow({
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  className = '',
}: DangerConfirmRowProps) {
  return (
    <div className={`flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 ${className}`.trim()}>
      <span className="text-sm font-medium text-rose-900 dark:text-rose-100">{message}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cockpit-btn-ghost px-3 py-1.5"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

