import React from 'react'
import { cn } from '@/lib/utils'

export const Form: React.FC<React.FormHTMLAttributes<HTMLFormElement>> = ({
  className,
  children,
  ...props
}) => (
  <form className={cn('space-y-5', className)} {...props}>
    {children}
  </form>
)

export const FormSection: React.FC<{
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}> = ({ title, description, className, children }) => (
  <div className={cn('border-b border-[#E4DED3] pb-5 mb-5 last:border-0 last:pb-0 last:mb-0', className)}>
    <div className="mb-3">
      <h4 className="font-serif text-sm font-bold text-[#1C1A17]">{title}</h4>
      {description && <p className="text-xs text-[#5A5347] mt-0.5">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const FormRow: React.FC<{
  columns?: 2 | 3 | 4
  className?: string
  children: React.ReactNode
}> = ({ columns = 2, className, children }) => {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns]

  return <div className={cn('grid gap-4', colClass, className)}>{children}</div>
}

export interface FormFieldProps {
  label?: string
  required?: boolean
  description?: string
  error?: string
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  description,
  error,
  className,
  children,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-xs font-semibold text-[#1C1A17]">
          {label} {required && <span className="text-[#9B2C2C]">*</span>}
        </label>
      )}
      {children}
      {description && !error && <p className="text-[11px] text-[#5A5347]">{description}</p>}
      {error && (
        <p className="text-[11px] text-[#9B2C2C] font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const FormActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('pt-4 border-t border-[#E4DED3] flex items-center justify-end gap-2.5', className)} {...props}>
    {children}
  </div>
)
