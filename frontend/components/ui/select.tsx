'use client'

import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex items-center justify-between w-full px-3 py-2 border border-[#d4d6d8] bg-white text-sm text-[#232e3e]',
        'focus:outline-none focus:border-[#006eb5] focus:ring-1 focus:ring-[#006eb5]',
        'placeholder:text-[#a9b1b7]',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={14} className="text-[#a9b1b7]" />
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'bg-white border border-[#d4d6d8] shadow-lg z-50 overflow-hidden min-w-[120px]',
          className
        )}
        position="popper"
        sideOffset={4}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...props }: SelectPrimitive.SelectItemProps) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex items-center gap-2 px-3 py-2 text-sm text-[#55606e] cursor-pointer',
        'data-[highlighted]:bg-[#dff0ff] data-[highlighted]:text-[#006eb5] data-[highlighted]:outline-none',
        'data-[state=checked]:text-[#006eb5] data-[state=checked]:font-600',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="ml-auto">
        <Check size={12} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
