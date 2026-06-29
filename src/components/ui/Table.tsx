import type { HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div className="cockpit-table-wrap overflow-x-auto">
      <table className={`w-full ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="cockpit-thead">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '' }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`cockpit-tr ${className}`.trim()}>{children}</tr>;
}

export function TableHeaderCell({ children, className = '' }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={`cockpit-th ${className}`.trim()}>{children}</th>;
}

export function TableCell({ children, className = '' }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={`cockpit-td ${className}`.trim()}>{children}</td>;
}
