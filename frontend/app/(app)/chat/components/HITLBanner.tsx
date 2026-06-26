'use client'

import { ClipboardCheck, Clock } from 'lucide-react'

export function HITLBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 bg-[rgba(217,119,6,0.10)] border border-[#D97706]/30 rounded-lg mx-4 mb-2">
      <ClipboardCheck className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-[#D97706]">Response Under Engineer Review</p>
        <p className="text-xs text-[#8B9BB4] mt-0.5">
          This response involves a pipeline action recommendation and is under review by a qualified engineer.
          You will be notified when the review is complete.
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#8B9BB4]">
        <Clock className="w-3.5 h-3.5" />
        ~15 min
      </div>
    </div>
  )
}
