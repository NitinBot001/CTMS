import React from 'react'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from '@/components/primitives/Icon'

export type AlertType = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType
  variant?: AlertType
  title?: string
  description?: React.ReactNode
  icon?: IconName
  onClose?: () => void
  children?: React.ReactNode
}

const typeStyles: Record<
  AlertType,
  { container: string; border: string; iconColor: string; defaultIcon: IconName }
> = {
  info: {
    container: 'bg-[#EFF5F9] text-[#1C1A17]',
    border: 'border-[#BFD7E7] border-l-4 border-l-[#315A78]',
    iconColor: 'text-[#315A78]',
    defaultIcon: 'info',
  },
  success: {
    container: 'bg-[#EDF6F1] text-[#1C1A17]',
    border: 'border-[#BDDCCB] border-l-4 border-l-[#1F5C3F]',
    iconColor: 'text-[#1F5C3F]',
    defaultIcon: 'success',
  },
  warning: {
    container: 'bg-[#FBF7EE] text-[#1C1A17]',
    border: 'border-[#E9D6A9] border-l-4 border-l-[#B8862E]',
    iconColor: 'text-[#B8862E]',
    defaultIcon: 'warning',
  },
  danger: {
    container: 'bg-[#FDF2F2] text-[#1C1A17]',
    border: 'border-[#F5C6C6] border-l-4 border-l-[#9B2C2C]',
    iconColor: 'text-[#9B2C2C]',
    defaultIcon: 'alert',
  },
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  variant,
  title,
  description,
  icon,
  onClose,
  className,
  children,
  ...props
}) => {
  const alertType = variant || type
  const config = typeStyles[alertType]
  const iconName = icon || config.defaultIcon
  const content = children ?? description

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 rounded-xs border flex items-start gap-3 text-xs leading-relaxed',
        config.container,
        config.border,
        className
      )}
      {...props}
    >
      <Icon name={iconName} size="md" className={cn('mt-0.5 shrink-0', config.iconColor)} />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-xs mb-0.5">{title}</h4>}
        {content && <div>{content}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-[#726B5C] hover:text-[#1C1A17] p-1 cursor-pointer"
        >
          <Icon name="close" size="xs" />
        </button>
      )}
    </div>
  )
}

export const InlineAlert: React.FC<{ type?: AlertType; children: React.ReactNode; className?: string }> = ({
  type = 'info',
  children,
  className,
}) => {
  const config = typeStyles[type]
  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs', config.iconColor, className)}>
      <Icon name={config.defaultIcon} size="xs" />
      <span>{children}</span>
    </div>
  )
}
