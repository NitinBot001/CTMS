import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/primitives/Icon'

export interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  size = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    if (open) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1C1A17]/60 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={cn(
            'relative transform overflow-hidden rounded-xs bg-white text-left shadow-xl transition-all w-full my-8 border border-[#E4DED3] animate-in zoom-in-95 duration-150',
            sizeClasses,
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export const DialogHeader: React.FC<{
  title: string
  description?: string
  onClose?: () => void
  className?: string
}> = ({ title, description, onClose, className }) => {
  return (
    <div className={cn('px-5 py-4 border-b border-[#E4DED3] flex items-start justify-between bg-white', className)}>
      <div>
        <h3 className="font-serif text-lg font-bold text-[#1C1A17]">{title}</h3>
        {description && <p className="text-xs text-[#5A5347] mt-0.5">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="text-[#726B5C] hover:text-[#1C1A17] p-1 rounded-xs cursor-pointer"
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  )
}

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('px-5 py-4 text-xs leading-relaxed max-h-[75vh] overflow-y-auto', className)} {...props}>
      {children}
    </div>
  )
}

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-[#E4DED3] bg-[#F8F6F2] flex items-center justify-end gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
