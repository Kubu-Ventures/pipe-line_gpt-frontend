'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Pencil, XCircle, Loader2, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ReviewItem, DecisionPayload } from '@/lib/api'
import { confidenceColor } from '@/lib/utils'

interface DecisionModalProps {
  item: ReviewItem | null
  onClose: () => void
  onDecision: (queryId: string, payload: DecisionPayload) => Promise<void>
}

const editSchema = z.object({ final_text: z.string().min(10, 'Response must be at least 10 characters') })
const rejectSchema = z.object({ reason: z.string().min(10, 'Reason is required (min 10 chars)') })

type EditValues = z.infer<typeof editSchema>
type RejectValues = z.infer<typeof rejectSchema>

export function DecisionModal({ item, onClose, onDecision }: DecisionModalProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'reject'>('view')
  const [loading, setLoading] = useState(false)

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { final_text: item?.answer_text ?? '' },
  })
  const rejectForm = useForm<RejectValues>({ resolver: zodResolver(rejectSchema) })

  if (!item) return null

  const riskBadgeVariant = (item.risk_level === 'HIGH' ? 'high' : item.risk_level === 'MEDIUM' ? 'medium' : 'low') as 'high' | 'medium' | 'low'

  async function handleApprove() {
    setLoading(true)
    try {
      await onDecision(item!.query_id, { decision: 'APPROVE' })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit(values: EditValues) {
    setLoading(true)
    try {
      await onDecision(item!.query_id, { decision: 'EDIT', final_text: values.final_text })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(values: RejectValues) {
    setLoading(true)
    try {
      await onDecision(item!.query_id, { decision: 'REJECT', reason: values.reason })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Review Response</DialogTitle>
            <Badge variant={riskBadgeVariant}>{item.risk_level} RISK</Badge>
            <span className="text-xs font-mono text-[#4A5A72] ml-auto">{item.query_id}</span>
          </div>
          <p className="text-sm italic text-[#8B9BB4] mt-1">"{item.question}"</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          {/* Left: AI answer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">AI Response</p>
              <div className="flex items-center gap-2 text-xs text-[#8B9BB4]">
                Confidence:
                <span style={{ color: confidenceColor(item.confidence_score) }} className="font-semibold">
                  {Math.round(item.confidence_score * 100)}%
                </span>
              </div>
            </div>
            <Progress
              value={item.confidence_score * 100}
              indicatorColor={confidenceColor(item.confidence_score)}
            />

            {mode === 'view' && (
              <div className="bg-[#050D1A] border border-[#1C2E4A] rounded-lg p-4 text-sm text-[#E8EDF4] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {item.answer_text}
              </div>
            )}
            {mode === 'edit' && (
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-3">
                <Textarea
                  className="min-h-[180px] text-sm"
                  {...editForm.register('final_text')}
                />
                {editForm.formState.errors.final_text && (
                  <p className="text-xs text-[#DC2626]">{editForm.formState.errors.final_text.message}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Edit & Deliver'}
                </Button>
              </form>
            )}
            {mode === 'reject' && (
              <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-3">
                <Label>Reason for rejection (required)</Label>
                <Textarea
                  placeholder="Explain why this response should not be delivered to the operator…"
                  className="min-h-[120px] text-sm"
                  {...rejectForm.register('reason')}
                />
                {rejectForm.formState.errors.reason && (
                  <p className="text-xs text-[#DC2626]">{rejectForm.formState.errors.reason.message}</p>
                )}
                <Button type="submit" variant="danger" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                </Button>
              </form>
            )}
          </div>

          {/* Right: source chunks */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">
              Source Documents ({item.citations.length})
            </p>
            <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
              {item.citations.map((c, i) => (
                <div key={i} className="bg-[#050D1A] border border-[#1C2E4A] rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#1D6FD9] shrink-0" />
                    <span className="text-xs font-medium text-[#E8EDF4] truncate">{c.filename}</span>
                    <span className="ml-auto font-mono text-[10px] text-[#4AA8FF] shrink-0">[{c.source_id}]</span>
                  </div>
                  <p className="text-xs text-[#8B9BB4] leading-relaxed line-clamp-4">{c.text_content}</p>
                  {c.section_label && (
                    <span className="text-[10px] text-[#4A5A72]">{c.section_label}</span>
                  )}
                </div>
              ))}
              {item.citations.length === 0 && (
                <p className="text-sm text-[#4A5A72] italic">No source chunks available</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {mode === 'view' && (
          <div className="flex gap-3 pt-2 border-t border-[#1C2E4A]">
            <Button onClick={handleApprove} variant="success" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve & Deliver</>}
            </Button>
            <Button onClick={() => setMode('edit')} variant="default" className="flex-1">
              <Pencil className="w-4 h-4" /> Edit Response
            </Button>
            <Button onClick={() => setMode('reject')} variant="danger" className="flex-1">
              <XCircle className="w-4 h-4" /> Reject
            </Button>
          </div>
        )}
        {mode !== 'view' && (
          <button
            onClick={() => setMode('view')}
            className="text-xs text-[#8B9BB4] hover:text-[#E8EDF4] transition-colors mt-1"
          >
            ← Back to review
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
