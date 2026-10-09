import React from 'react'
import { cn } from '@/lib/utils'

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full text-left border-collapse text-xs', className)} {...props}>
      {children}
    </table>
  </div>
)

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={cn('bg-[#F8F6F2] border-b border-[#E4DED3] text-[#5A5347] font-semibold select-none', className)} {...props}>
    {children}
  </thead>
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={cn('divide-y divide-[#E4DED3] bg-white', className)} {...props}>
    {children}
  </tbody>
)

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr className={cn('hover:bg-[#F8F6F2]/70 transition-colors', className)} {...props}>
    {children}
  </tr>
)

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <th className={cn('py-3 px-4 font-semibold text-xs tracking-tight', className)} {...props}>
    {children}
  </th>
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td className={cn('py-3 px-4 align-middle', className)} {...props}>
    {children}
  </td>
)
