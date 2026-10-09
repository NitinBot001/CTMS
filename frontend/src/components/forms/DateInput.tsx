import { forwardRef } from 'react'
import { Input, type InputProps } from './Input'
import { Icon } from '@/components/primitives/Icon'

export const DateInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  (props, ref) => {
    return (
      <Input
        ref={ref}
        type="date"
        rightAddon={<Icon name="calendar" size="xs" />}
        {...props}
      />
    )
  }
)

DateInput.displayName = 'DateInput'
