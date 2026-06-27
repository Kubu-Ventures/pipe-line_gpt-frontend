'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-[#edeff0] border border-[#d4d6d8]',
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
        'px-4 py-1.5 text-sm font-500 text-[#55606e] transition-all',
        'data-[state=active]:bg-white data-[state=active]:text-[#006eb5] data-[state=active]:shadow-sm data-[state=active]:font-600',
        'hover:text-[#232e3e]',
        className
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content
