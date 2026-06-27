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
        'flex items-center justify-between w-full px-3 py-2 rounded-[4px] border border-[#C8D0DC] bg-white text-sm text-[#1A1A2A]',
        'focus:outline-none focus:border-[#005DAA] focus:ring-1 focus:ring-[#005DAA]',
        'placeholder:text-[#8896A8]',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={14} className="text-[#8896A8]" />
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, ...props }: SelectPrimitive.SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={cn(
          'bg-white border border-[#E4E8EF] rounded-[6px] shadow-lg z-50 overflow-hidden min-w-[120px]',
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
        'flex items-center gap-2 px-3 py-2 text-sm text-[#4A5568] rounded-[3px] cursor-pointer',
        'data-[highlighted]:bg-[#E8F0F9] data-[highlighted]:text-[#005DAA] data-[highlighted]:outline-none',
        'data-[state=checked]:text-[#005DAA] data-[state=checked]:font-600',
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
