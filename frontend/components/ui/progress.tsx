'use client'

import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const color =
    value < 75 ? '#B91C1C' : value < 90 ? '#B45309' : '#1A7A4A'

  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-[#E4E8EF]', className)}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full transition-all duration-500"
        style={{ width: `${value}%`, background: color }}
      />
    </ProgressPrimitive.Root>
  )
}
