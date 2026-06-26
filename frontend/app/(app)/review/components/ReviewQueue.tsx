'use client'

import { ReviewCard } from './ReviewCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReviewItem } from '@/lib/api'

interface ReviewQueueProps {
  items: ReviewItem[]
  loading: boolean
  onAction: (item: ReviewItem) => void
}

export function ReviewQueue({ items, loading, onAction }: ReviewQueueProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-[rgba(22,163,74,0.10)] border border-[#16A34A]/20 flex items-center justify-center">
          <span className="text-xl">✓</span>
        </div>
        <p className="text-sm font-medium text-[#E8EDF4]">Queue is clear</p>
        <p className="text-xs text-[#8B9BB4]">No responses pending review in this category</p>
      </div>
    )
  }

  const sorted = [...items].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return order[a.risk_level] - order[b.risk_level]
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((item) => (
        <ReviewCard key={item.id} item={item} onAction={onAction} />
      ))}
    </div>
  )
}
