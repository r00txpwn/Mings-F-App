import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
import { cn } from '@/lib/utils';

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

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !locked) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                tone === 'danger' ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary',
              )}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-1">{message}</AlertDialogDescription>
              {errorMessage ? (
                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={locked} onClick={onCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={cn(tone === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            {confirmLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {confirmLoadingLabel ?? confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
