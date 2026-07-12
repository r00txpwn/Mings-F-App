import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import {
  Table as ShadTable,
  TableBody as ShadTableBody,
  TableCell as ShadTableCell,
  TableHead as ShadTableHead,
  TableHeader as ShadTableHeader,
  TableRow as ShadTableRow,
} from '@/components/shadcn/table';
import { cn } from '@/lib/utils';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <ShadTable className={cn(className)} {...props}>
        {children}
      </ShadTable>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <ShadTableHeader>{children}</ShadTableHeader>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <ShadTableBody>{children}</ShadTableBody>;
}

export function TableRow({ children, className = '' }: HTMLAttributes<HTMLTableRowElement>) {
  return <ShadTableRow className={cn(className)}>{children}</ShadTableRow>;
}

export function TableHeaderCell({ children, className = '' }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <ShadTableHead className={cn('text-[10px] font-bold uppercase tracking-wider text-muted-foreground', className)}>
      {children}
    </ShadTableHead>
  );
}

export function TableCell({ children, className = '' }: HTMLAttributes<HTMLTableCellElement>) {
  return <ShadTableCell className={cn(className)}>{children}</ShadTableCell>;
}
