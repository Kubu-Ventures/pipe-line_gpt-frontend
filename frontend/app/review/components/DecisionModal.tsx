'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Edit3, XCircle, FileText, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ReviewItem } from '@/lib/api'

function isPHMSA(filename: string) {
  return filename.toLowerCase().includes('phmsa')
}

const PHMSA_URL = 'https://www.phmsa.dot.gov/data-and-statistics/pipeline/pipeline-incident-flagged-files'

const editSchema = z.object({ final_text: z.string().min(10, 'Response must be at least 10 characters') })
const rejectSchema = z.object({ reason: z.string().min(5, 'Please provide a reason') })

type DecisionType = 'APPROVE' | 'EDIT' | 'REJECT'

interface DecisionModalProps {
  item: ReviewItem
  open: boolean
  initialMode?: DecisionType | null
  onClose: () => void
  onDecision: (decision: { decision: DecisionType; final_text?: string; reason?: string }) => void
  isPending: boolean
}

export function DecisionModal({ item, open, initialMode, onClose, onDecision, isPending }: DecisionModalProps) {
  const [mode, setMode] = useState<DecisionType | null>(initialMode ?? null)

  const editForm = useForm({ resolver: zodResolver(editSchema), defaultValues: { final_text: item.answer_text } })
  const rejectForm = useForm({ resolver: zodResolver(rejectSchema) })

  const riskVariant: Record<string, 'high' | 'medium' | 'low'> = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Badge variant={riskVariant[item.risk_level] ?? 'gray'}>{item.risk_level} RISK</Badge>
            <span style={{ fontSize: '0.8125rem', color: '#8896A8' }}>Confidence: {Math.round(item.confidence_score * 100)}%</span>
          </div>
          <DialogTitle>Review AI Response</DialogTitle>
          <DialogDescription>Original query · {new Date(item.created_at).toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', minHeight: '400px' }}>
          {/* Left: content */}
          <div style={{ padding: '24px', borderRight: '1px solid #E4E8EF', overflow: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: '6px' }}>
                Original Query
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#1A1A2A', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{item.question_raw}"
              </p>
            </div>

            <div style={{ borderTop: '1px solid #E4E8EF', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: '8px' }}>
                AI Response
              </div>
              <p style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {item.answer_text}
              </p>
            </div>

            {item.citations_json?.length > 0 && (
              <div style={{ borderTop: '1px solid #E4E8EF', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: '10px' }}>
                  Sources cited ({item.citations_json.length})
                </div>
                {item.citations_json.map((c, i) => (
                  <div key={i} style={{ marginBottom: '10px', border: '1px solid #E4E8EF', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* Source header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#F8F9FB', borderBottom: c.text ? '1px solid #E4E8EF' : 'none' }}>
                      <FileText size={13} color="#005DAA" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                          {c.source_id && (
                            <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', fontWeight: 700, color: '#005DAA', background: '#E8F0F9', padding: '1px 5px', borderRadius: 2 }}>
                              {c.source_id}
                            </span>
                          )}
                          {c.page_ref && (
                            <span style={{ fontSize: '0.6875rem', color: '#8896A8' }}>{c.page_ref}</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A2A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.filename}
                        </div>
                        {c.section_label && (
                          <div style={{ fontSize: '0.75rem', color: '#8896A8' }}>{c.section_label}</div>
                        )}
                      </div>
                    </div>
                    {/* Excerpt */}
                    {c.text && (
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{ fontSize: '0.8125rem', color: '#4A5568', lineHeight: 1.6, borderLeft: '3px solid #005DAA', paddingLeft: '8px', fontStyle: 'italic', margin: 0 }}>
                          {c.text}
                        </p>
                      </div>
                    )}
                    {/* PHMSA external link */}
                    {isPHMSA(c.filename) && (
                      <div style={{ padding: '6px 10px', borderTop: '1px solid #E4E8EF', background: '#F0F7FF' }}>
                        <a href={PHMSA_URL} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 600, color: '#005DAA', textDecoration: 'none' }}>
                          <ExternalLink size={11} /> Open PHMSA Data Portal
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: decision panel */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: '4px' }}>
              Engineer Decision
            </div>

            {!mode && (
              <>
                <button
                  onClick={() => onDecision({ decision: 'APPROVE' })}
                  disabled={isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <CheckCircle size={18} color="#1A7A4A" />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1A7A4A' }}>Approve</div>
                    <div style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Deliver response as-is to user</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('EDIT')}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Edit3 size={18} color="#005DAA" />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#005DAA' }}>Edit & Approve</div>
                    <div style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Amend response before delivery</div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('REJECT')}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <XCircle size={18} color="#B91C1C" />
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#B91C1C' }}>Reject</div>
                    <div style={{ fontSize: '0.8125rem', color: '#4A5568' }}>Suppress response, log reason</div>
                  </div>
                </button>
              </>
            )}

            {mode === 'EDIT' && (
              <form onSubmit={editForm.handleSubmit(d => onDecision({ decision: 'EDIT', final_text: d.final_text }))}>
                <div style={{ marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#1A1A2A' }}>Edit Response</div>
                <textarea
                  {...editForm.register('final_text')}
                  rows={10}
                  style={{ width: '100%', padding: '10px', border: '1px solid #C8D0DC', borderRadius: '4px', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
                />
                {editForm.formState.errors.final_text && (
                  <p style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '4px' }}>{editForm.formState.errors.final_text.message}</p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button type="submit" variant="primary" size="sm" disabled={isPending}>Approve Edited</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>Back</Button>
                </div>
              </form>
            )}

            {mode === 'REJECT' && (
              <form onSubmit={rejectForm.handleSubmit(d => onDecision({ decision: 'REJECT', reason: d.reason }))}>
                <div style={{ marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500, color: '#1A1A2A' }}>Rejection Reason <span style={{ color: '#B91C1C' }}>*</span></div>
                <textarea
                  {...rejectForm.register('reason')}
                  rows={5}
                  placeholder="Describe why this response is unsuitable…"
                  style={{ width: '100%', padding: '10px', border: '1px solid #C8D0DC', borderRadius: '4px', fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical', outline: 'none' }}
                />
                {rejectForm.formState.errors.reason && (
                  <p style={{ fontSize: '0.8125rem', color: '#B91C1C', marginTop: '4px' }}>{rejectForm.formState.errors.reason.message}</p>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button type="submit" variant="danger" size="sm" disabled={isPending}>Confirm Rejection</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>Back</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
