import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[]
  placeholder?: string
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 text-xs bg-white text-[#1C1A17] border rounded-xs transition-colors duration-150 appearance-none cursor-pointer',
            'focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12]',
            'disabled:bg-[#F8F6F2] disabled:text-[#726B5C] disabled:cursor-not-allowed',
            error ? 'border-[#9B2C2C] focus:outline-[#9B2C2C]' : 'border-[#C9C2B3]',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#726B5C]">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'
