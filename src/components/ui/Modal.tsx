import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  children: ReactNode;
  widthClassName?: string;
  contentClassName?: string;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  allowClose?: boolean;
}

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
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && allowClose) onClose();
      }}
    >
      <DialogContent
        className={cn(
          'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg',
          widthClassName,
          contentClassName,
        )}
        showCloseButton={showCloseButton && allowClose}
      >
        {title ? (
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle id={titleId}>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
