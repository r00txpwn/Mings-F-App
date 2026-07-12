import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

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
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-3',
        className,
      )}
    >
      <span className="text-sm font-medium text-destructive">{message}</span>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={onConfirm} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={confirmDisabled}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
