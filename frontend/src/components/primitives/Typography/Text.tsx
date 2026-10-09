import React from 'react'
import { cn } from '@/lib/utils'

export type TextVariant = 'body' | 'secondary' | 'muted' | 'inverse' | 'danger' | 'success' | 'warning'
export type TextSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl'

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  size?: TextSize
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  as?: 'p' | 'span' | 'div' | 'label'
  children: React.ReactNode
}

const variantStyles: Record<TextVariant, string> = {
  body: 'text-[#1C1A17]',
  secondary: 'text-[#5A5347]',
  muted: 'text-[#726B5C]',
  inverse: 'text-white',
  danger: 'text-[#9B2C2C]',
  success: 'text-[#1F5C3F]',
  warning: 'text-[#B8862E]',
}

const sizeStyles: Record<TextSize, string> = {
  xs: 'text-[11px] leading-4',
  sm: 'text-xs leading-4',
  base: 'text-xs sm:text-sm leading-5',
  md: 'text-sm leading-5',
  lg: 'text-base leading-6',
  xl: 'text-lg leading-7',
}

const weightStyles = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  size = 'base',
  weight = 'normal',
  as: Component = 'p',
  className,
  children,
  ...props
}) => {
  const ComponentTag = Component as React.ElementType
  return (
    <ComponentTag
      className={cn(
        'font-sans',
        variantStyles[variant],
        sizeStyles[size],
        weightStyles[weight],
        className
      )}
      {...props}
    >
      {children}
    </ComponentTag>
  )
}

export const Caption: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({
  className,
  children,
  ...props
}) => (
  <span className={cn('text-[11px] text-[#726B5C] font-normal leading-tight', className)} {...props}>
    {children}
  </span>
)

export const HelperText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-[#5A5347] mt-1', className)} {...props}>
    {children}
  </p>
)

export const ErrorText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={cn('text-xs text-[#9B2C2C] font-medium mt-1', className)} role="alert" {...props}>
    {children}
  </p>
)

export const Code: React.FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...props
}) => (
  <code
    className={cn(
      'font-mono text-xs bg-[#F8F6F2] border border-[#E4DED3] px-1 py-0.5 rounded-xs text-[#7A2A12]',
      className
    )}
    {...props}
  >
    {children}
  </code>
)

export const TruncatedText: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { maxWidth?: string; lines?: number }
> = ({ maxWidth, lines = 1, className, children, ...props }) => {
  const lineClampClass =
    lines === 1 ? 'truncate block' : `line-clamp-${lines}`

  return (
    <span
      style={{ maxWidth }}
      className={cn(lineClampClass, className)}
      title={typeof children === 'string' ? children : undefined}
      {...props}
    >
      {children}
    </span>
  )
}
