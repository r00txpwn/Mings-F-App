import { AlertTriangle } from 'lucide-react';

interface ReviewBadgeProps {
  label: string;
  reason: string;
}

/** Flags anomalous financial values for staff review (not just red/green). */
export function ReviewBadge({ label, reason }: ReviewBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800"
      title={reason}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
