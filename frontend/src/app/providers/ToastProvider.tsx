import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/primitives/Icon'
import { ToastContext, type ToastItem, type ToastType } from './toastContext'

export type { ToastItem, ToastType }

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ title, message, type, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToastItem = { id, title, message, type, duration }
      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = useCallback(
    (title: string, message?: string) => addToast({ title, message, type: 'success' }),
    [addToast]
  )
  const error = useCallback(
    (title: string, message?: string) => addToast({ title, message, type: 'danger' }),
    [addToast]
  )
  const warning = useCallback(
    (title: string, message?: string) => addToast({ title, message, type: 'warning' }),
    [addToast]
  )
  const info = useCallback(
    (title: string, message?: string) => addToast({ title, message, type: 'info' }),
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              border: 'border-[#1F5C3F] bg-white',
              iconColor: 'text-[#1F5C3F]',
              icon: 'success' as const,
            },
            danger: {
              border: 'border-[#9B2C2C] bg-white',
              iconColor: 'text-[#9B2C2C]',
              icon: 'error' as const,
            },
            warning: {
              border: 'border-[#B8862E] bg-white',
              iconColor: 'text-[#B8862E]',
              icon: 'warning' as const,
            },
            info: {
              border: 'border-[#315A78] bg-white',
              iconColor: 'text-[#315A78]',
              icon: 'info' as const,
            },
          }[toast.type]

          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                'pointer-events-auto p-3.5 rounded-xs border-l-4 border shadow-md flex items-start gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200',
                typeConfig.border
              )}
            >
              <Icon
                name={typeConfig.icon}
                size="md"
                className={cn('shrink-0 mt-0.5', typeConfig.iconColor)}
              />
              <div className="flex-1">
                <div className="font-semibold text-[#1C1A17]">{toast.title}</div>
                {toast.message && (
                  <div className="text-[#5A5347] mt-0.5">{toast.message}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss toast"
                className="text-[#726B5C] hover:text-[#1C1A17] cursor-pointer p-0.5"
              >
                <Icon name="close" size="xs" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
