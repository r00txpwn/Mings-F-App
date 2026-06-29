interface DangerConfirmRowProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function DangerConfirmRow({
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
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
          disabled={confirmDisabled}
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={confirmDisabled}
          className="cockpit-btn-ghost px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

