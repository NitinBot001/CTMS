import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const inputId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className={cn('flex items-start gap-2 select-none', className)}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="mt-0.5 w-4 h-4 rounded-xs border-[#C9C2B3] text-[#7A2A12] focus:ring-[#B8862E] focus:ring-offset-0 cursor-pointer"
          {...props}
        />
        {label && (
          <div className="text-xs">
            <label htmlFor={inputId} className="font-medium text-[#1C1A17] cursor-pointer">
              {label}
            </label>
            {description && <p className="text-[11px] text-[#5A5347] mt-0.5">{description}</p>}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, checked, id, ...props }, ref) => {
    const inputId = id || (label ? `sw-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <label htmlFor={inputId} className={cn('flex items-center gap-2.5 cursor-pointer select-none', className)}>
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div className="w-8 h-4 bg-[#C9C2B3] peer-focus:outline-2 peer-focus:outline-[#B8862E] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#C9C2B3] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7A2A12]" />
        </div>
        {label && <span className="text-xs font-medium text-[#1C1A17]">{label}</span>}
      </label>
    )
  }
)

Switch.displayName = 'Switch'
