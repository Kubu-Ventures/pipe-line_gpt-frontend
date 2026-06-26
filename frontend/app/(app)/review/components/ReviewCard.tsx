'use client'

import { CheckCircle2, Pencil, XCircle, FileText, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ReviewItem } from '@/lib/api'
import { formatDate, truncate, confidenceColor, riskColor } from '@/lib/utils'

interface ReviewCardProps {
  item: ReviewItem
  onAction: (item: ReviewItem) => void
}

export function ReviewCard({ item, onAction }: ReviewCardProps) {
  const risk = riskColor(item.risk_level)
  const confColor = confidenceColor(item.confidence_score)
  const riskVariant = (item.risk_level === 'HIGH' ? 'high' : item.risk_level === 'MEDIUM' ? 'medium' : 'low') as 'high' | 'medium' | 'low'

  return (
    <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5 flex flex-col gap-4 hover:border-[#2A4270] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm italic text-[#8B9BB4] leading-relaxed flex-1">
          "{truncate(item.question, 120)}"
        </p>
        <Badge variant={riskVariant} className="shrink-0">{item.risk_level}</Badge>
      </div>

      {/* AI answer preview */}
      <p className="text-sm text-[#E8EDF4] line-clamp-3 leading-relaxed">
        {truncate(item.answer_text, 240)}
      </p>

      {/* Confidence */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4A5A72]">Confidence score</span>
          <span style={{ color: confColor }} className="font-semibold font-mono">
            {Math.round(item.confidence_score * 100)}%
          </span>
        </div>
        <Progress value={item.confidence_score * 100} indicatorColor={confColor} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-[#4A5A72]">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          {item.citations.length} sources
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(item.submitted_at)}
        </span>
        <span className="ml-auto truncate">{item.submitted_by}</span>
      </div>

      {/* Actions */}
      {!item.decision ? (
        <div className="flex gap-2 pt-1 border-t border-[#1C2E4A]">
          <Button
            size="sm"
            variant="success"
            className="flex-1 text-xs"
            onClick={() => onAction(item)}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="default"
            className="flex-1 text-xs"
            onClick={() => onAction(item)}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            className="flex-1 text-xs"
            onClick={() => onAction(item)}
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="pt-1 border-t border-[#1C2E4A]">
          <Badge variant={item.decision === 'APPROVE' ? 'success' : item.decision === 'REJECT' ? 'danger' : 'primary'}>
            {item.decision === 'APPROVE' ? 'Approved' : item.decision === 'EDIT' ? 'Edited & Delivered' : 'Rejected'}
          </Badge>
          {item.reason && (
            <p className="text-xs text-[#8B9BB4] mt-1">Reason: {item.reason}</p>
          )}
        </div>
      )}
    </div>
  )
}
