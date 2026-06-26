'use client'

import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ReviewQueue } from './components/ReviewQueue'
import { DecisionModal } from './components/DecisionModal'
import { useReviewQueue, useSubmitDecision } from '@/hooks/useReviewQueue'
import type { ReviewItem, DecisionPayload } from '@/lib/api'

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null)

  const { data: pendingItems = [], isLoading: pendingLoading } = useReviewQueue(undefined)
  const { data: approvedItems = [], isLoading: approvedLoading } = useReviewQueue('APPROVE')
  const { data: rejectedItems = [], isLoading: rejectedLoading } = useReviewQueue('REJECT')
  const { mutateAsync: submitDecision } = useSubmitDecision()

  const pendingCount = pendingItems.filter((i) => !i.decision).length

  async function handleDecision(queryId: string, payload: DecisionPayload) {
    await submitDecision({ queryId, payload })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-6 h-6 text-[#1D6FD9]" />
        <h1 className="text-xl font-semibold text-[#E8EDF4] tracking-tight">Review Queue</h1>
        {pendingCount > 0 && (
          <Badge variant="danger" className="text-sm px-2.5 py-1">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 text-[10px] bg-[#DC2626] text-white rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <ReviewQueue
            items={pendingItems.filter((i) => !i.decision)}
            loading={pendingLoading}
            onAction={setSelectedItem}
          />
        </TabsContent>

        <TabsContent value="approved">
          <ReviewQueue
            items={approvedItems}
            loading={approvedLoading}
            onAction={setSelectedItem}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <ReviewQueue
            items={rejectedItems}
            loading={rejectedLoading}
            onAction={setSelectedItem}
          />
        </TabsContent>
      </Tabs>

      <DecisionModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onDecision={handleDecision}
      />
    </div>
  )
}
