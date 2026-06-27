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

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'

function isPHMSA(filename: string) {
  return filename.toLowerCase().includes('phmsa')
}

const PHMSA_URL = 'https://www.phmsa.dot.gov/data-and-statistics/pipeline/pipeline-incident-flagged-files'

const editSchema   = z.object({ final_text: z.string().min(10, 'Response must be at least 10 characters') })
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

/* UNDP-style decision option — left-bar accent, rectangular, no fill */
function DecisionOption({
  onClick, icon, label, description, barColor, disabled,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  description: string
  barColor: string
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: '#fff',
        border: '1px solid #d4d6d8',
        borderLeft: `4px solid ${barColor}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = '#fafafa' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = '#fff' }}
    >
      {icon}
      <div>
        <div style={{ fontFamily: F, fontSize: '0.9375rem', fontWeight: 700, color: barColor, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontFamily: F, fontSize: '0.8125rem', color: '#55606e' }}>
          {description}
        </div>
      </div>
    </button>
  )
}

export function DecisionModal({ item, open, initialMode, onClose, onDecision, isPending }: DecisionModalProps) {
  const [mode, setMode] = useState<DecisionType | null>(initialMode ?? null)

  const editForm   = useForm({ resolver: zodResolver(editSchema),   defaultValues: { final_text: item.answer_text } })
  const rejectForm = useForm({ resolver: zodResolver(rejectSchema) })

  const riskVariant: Record<string, 'high' | 'medium' | 'low'> = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        {/* UNDP dark header inside modal */}
        <div style={{ background: DARK, padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Badge variant={riskVariant[item.risk_level] ?? 'gray'}>{item.risk_level} RISK</Badge>
            <span style={{ fontFamily: F, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.50)' }}>
              Confidence: {Math.round(item.confidence_score * 100)}%
            </span>
          </div>
          <h2 style={{ fontFamily: F, fontSize: '1.125rem', fontWeight: 700, color: '#fff', marginBottom: 3 }}>
            Review AI Response
          </h2>
          <p style={{ fontFamily: F, fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)' }}>
            Original query · {new Date(item.created_at).toLocaleString()}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 400, maxHeight: 'calc(90vh - 140px)', overflow: 'hidden' }}>

          {/* Left: AI response + sources */}
          <div style={{ padding: '20px 24px', borderRight: '1px solid #d4d6d8', overflowY: 'auto' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a9b1b7', marginBottom: 6 }}>
                Original Query
              </div>
              <p style={{ fontFamily: F, fontSize: '0.9375rem', color: DARK, fontStyle: 'italic', lineHeight: 1.55 }}>
                "{item.question_raw}"
              </p>
            </div>

            <div style={{ borderTop: '1px solid #edeff0', paddingTop: 16, marginBottom: 16 }}>
              <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a9b1b7', marginBottom: 8 }}>
                AI Response
              </div>
              <p style={{ fontFamily: F, fontSize: '0.875rem', color: '#55606e', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                {item.answer_text}
              </p>
            </div>

            {item.citations_json?.length > 0 && (
              <div style={{ borderTop: '1px solid #edeff0', paddingTop: 16 }}>
                <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a9b1b7', marginBottom: 10 }}>
                  Sources cited ({item.citations_json.length})
                </div>
                {item.citations_json.map((c, i) => (
                  <div key={i} style={{
                    marginBottom: 10,
                    border: '1px solid #d4d6d8',
                    borderLeft: `3px solid ${BLUE}`,
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fafafa', borderBottom: c.text ? '1px solid #edeff0' : 'none' }}>
                      <FileText size={12} color={BLUE} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          {c.source_id && (
                            <span style={{
                              fontFamily: 'monospace', fontSize: '0.6875rem', fontWeight: 700,
                              color: BLUE, background: '#dff0ff',
                              padding: '1px 5px',
                              border: '1px solid #b8d4f0',
                            }}>
                              {c.source_id}
                            </span>
                          )}
                          {c.page_ref && (
                            <span style={{ fontFamily: F, fontSize: '0.6875rem', color: '#a9b1b7' }}>{c.page_ref}</span>
                          )}
                        </div>
                        <div style={{ fontFamily: F, fontSize: '0.8125rem', fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.filename}
                        </div>
                        {c.section_label && (
                          <div style={{ fontFamily: F, fontSize: '0.75rem', color: '#a9b1b7' }}>{c.section_label}</div>
                        )}
                      </div>
                    </div>

                    {c.text && (
                      <div style={{ padding: '8px 10px' }}>
                        <p style={{
                          fontFamily: F, fontSize: '0.8125rem', color: '#55606e', lineHeight: 1.6,
                          borderLeft: `3px solid #d4d6d8`, paddingLeft: 8, fontStyle: 'italic', margin: 0,
                        }}>
                          {c.text}
                        </p>
                      </div>
                    )}

                    {isPHMSA(c.filename) && (
                      <div style={{ padding: '6px 10px', borderTop: '1px solid #edeff0', background: '#dff0ff' }}>
                        <a href={PHMSA_URL} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: F, fontSize: '0.75rem', fontWeight: 600, color: BLUE, textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                        >
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
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            <div style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#a9b1b7', marginBottom: 6 }}>
              Engineer Decision
            </div>

            {!mode && (
              <>
                <DecisionOption
                  onClick={() => onDecision({ decision: 'APPROVE' })}
                  icon={<CheckCircle size={20} color="#1A7A4A" />}
                  label="Approve"
                  description="Deliver response as-is to user"
                  barColor="#1A7A4A"
                  disabled={isPending}
                />
                <DecisionOption
                  onClick={() => setMode('EDIT')}
                  icon={<Edit3 size={20} color={BLUE} />}
                  label="Edit & Approve"
                  description="Amend response before delivery"
                  barColor={BLUE}
                  disabled={isPending}
                />
                <DecisionOption
                  onClick={() => setMode('REJECT')}
                  icon={<XCircle size={20} color="#B91C1C" />}
                  label="Reject"
                  description="Suppress response, log reason"
                  barColor="#B91C1C"
                  disabled={isPending}
                />
              </>
            )}

            {mode === 'EDIT' && (
              <form onSubmit={editForm.handleSubmit(d => onDecision({ decision: 'EDIT', final_text: d.final_text }))}>
                <div style={{ fontFamily: F, marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: DARK }}>
                  Edit Response
                </div>
                <textarea
                  {...editForm.register('final_text')}
                  rows={10}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '2px solid #d4d6d8',
                    fontSize: '0.875rem', fontFamily: F,
                    lineHeight: 1.6, resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.15s',
                    color: DARK,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4d6d8')}
                />
                {editForm.formState.errors.final_text && (
                  <p style={{ fontFamily: F, fontSize: '0.8125rem', color: '#B91C1C', marginTop: 4 }}>
                    {editForm.formState.errors.final_text.message}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Button type="submit" variant="primary" size="sm" disabled={isPending}>Approve Edited</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMode(null)}>Back</Button>
                </div>
              </form>
            )}

            {mode === 'REJECT' && (
              <form onSubmit={rejectForm.handleSubmit(d => onDecision({ decision: 'REJECT', reason: d.reason }))}>
                <div style={{ fontFamily: F, marginBottom: 8, fontSize: '0.875rem', fontWeight: 600, color: DARK }}>
                  Rejection Reason <span style={{ color: '#B91C1C' }}>*</span>
                </div>
                <textarea
                  {...rejectForm.register('reason')}
                  rows={5}
                  placeholder="Describe why this response is unsuitable…"
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '2px solid #d4d6d8',
                    fontSize: '0.875rem', fontFamily: F,
                    lineHeight: 1.6, resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.15s',
                    color: DARK,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#B91C1C')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#d4d6d8')}
                />
                {rejectForm.formState.errors.reason && (
                  <p style={{ fontFamily: F, fontSize: '0.8125rem', color: '#B91C1C', marginTop: 4 }}>
                    {rejectForm.formState.errors.reason.message}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
