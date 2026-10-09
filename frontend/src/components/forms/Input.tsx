import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, leftAddon, rightAddon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftAddon && (
          <div className="absolute left-3 text-[#726B5C] pointer-events-none flex items-center">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-3 py-2 text-xs bg-white text-[#1C1A17] border rounded-xs transition-colors duration-150',
            'placeholder:text-[#726B5C]/70',
            'focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12]',
            'disabled:bg-[#F8F6F2] disabled:text-[#726B5C] disabled:cursor-not-allowed',
            error ? 'border-[#9B2C2C] focus:outline-[#9B2C2C]' : 'border-[#C9C2B3]',
            leftAddon ? 'pl-9' : undefined,
            rightAddon ? 'pr-9' : undefined,
            className
          )}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 text-[#726B5C] flex items-center">
            {rightAddon}
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, className, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full p-2.5 text-xs bg-white text-[#1C1A17] border rounded-xs transition-colors duration-150',
          'placeholder:text-[#726B5C]/70',
          'focus:outline-2 focus:outline-[#B8862E] focus:border-[#7A2A12]',
          'disabled:bg-[#F8F6F2] disabled:text-[#726B5C] disabled:cursor-not-allowed',
          error ? 'border-[#9B2C2C] focus:outline-[#9B2C2C]' : 'border-[#C9C2B3]',
          className
        )}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'
