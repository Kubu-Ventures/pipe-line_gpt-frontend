'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-[4px] bg-[#F2F4F7] border border-[#E4E8EF]',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'px-4 py-1.5 rounded-[3px] text-sm font-500 text-[#4A5568] transition-all',
        'data-[state=active]:bg-white data-[state=active]:text-[#005DAA] data-[state=active]:shadow-sm data-[state=active]:font-600',
        'hover:text-[#1A1A2A]',
        className
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content
