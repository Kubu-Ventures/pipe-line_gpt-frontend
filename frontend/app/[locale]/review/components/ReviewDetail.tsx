'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, Check, ChevronRight, Pencil, ShieldAlert, X } from 'lucide-react'
import type { Citation, ReviewItem } from '@/lib/api'
import { citationComponents } from '@/components/CitationChip'
import { citationNumber, linkCitations, sourceHeading } from '@/lib/utils'
import { BLUE, BODY, F, INK, LINE, MUTED, SURFACE, holdReason, riskOf, statusOf, timeAgo } from './reviewStyle'

export type Decision = { decision: 'APPROVE' | 'EDIT' | 'REJECT'; final_text?: string; reason?: string }

interface ReviewDetailProps {
  item: ReviewItem
  onDecide: (d: Decision) => void
  deciding: boolean
  onOpenSource: (sourceId: string | null) => void
  onBack?: () => void
}

const label: React.CSSProperties = {
  fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: MUTED, margin: '0 0 10px',
}

function Button({ kind, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { kind: 'approve' | 'secondary' | 'reject' | 'ghost' }) {
  const look = {
    approve:   { background: '#067647', color: '#fff', border: '1px solid #067647' },
    secondary: { background: '#fff', color: INK, border: `1px solid #C9D1DB` },
    reject:    { background: '#fff', color: '#B42318', border: '1px solid #F1B5AE' },
    ghost:     { background: 'transparent', color: MUTED, border: '1px solid transparent' },
  }[kind]
  return (
    <button
      {...rest}
      style={{
        ...look, fontFamily: F, fontSize: 13.5, fontWeight: 600, padding: '9px 16px', borderRadius: 6,
        display: 'inline-flex', alignItems: 'center', gap: 7,
        cursor: rest.disabled ? 'not-allowed' : 'pointer', opacity: rest.disabled ? 0.6 : 1,
        ...rest.style,
      }}
    >
      {children}
    </button>
  )
}

function SourceRow({ c, onOpen }: { c: Citation; onOpen: () => void }) {
  const heading = sourceHeading(c)
  return (
    <li style={{ borderTop: `1px solid ${LINE}` }}>
      <button
        onClick={onOpen}
        className="rq-source"
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
      >
        <span style={{ minWidth: 24, height: 24, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: BLUE, background: '#E6F1FA', flexShrink: 0 }}>
          {citationNumber(c.source_id)}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: INK }}>{heading.title}</span>
          <span style={{ display: 'block', fontSize: 12, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{heading.detail}</span>
        </span>
        <ChevronRight size={16} color={MUTED} />
      </button>
    </li>
  )
}

/** One held answer, read top to bottom, with the decision at the foot. */
export function ReviewDetail({ item, onDecide, deciding, onOpenSource, onBack }: ReviewDetailProps) {
  const [mode, setMode] = useState<'idle' | 'confirm' | 'edit' | 'reject'>('idle')
  const [editText, setEditText] = useState(item.answer_text ?? '')
  const [reason, setReason] = useState('')

  const risk = riskOf(item.risk_level)
  const status = statusOf(item.status)
  const pending = item.status === 'PENDING'
  const citations = item.citations_json ?? []
  const confidence = Math.round(item.confidence_score * 100)
  const editTooShort = editText.trim().length < 10
  const reasonTooShort = reason.trim().length < 5

  function approve() {
    // A high-risk answer goes to the operator only after a second, explicit click
    if (item.risk_level === 'HIGH' && mode !== 'confirm') setMode('confirm')
    else onDecide({ decision: 'APPROVE' })
  }

  return (
    <article style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: F }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 40px 40px' }} className="rq-detail-body">

          {onBack && (
            <button onClick={onBack} className="rq-back" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', padding: 0, marginBottom: 18, color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
              <ArrowLeft size={15} /> Back to queue
            </button>
          )}

          {/* One quiet line: risk (or outcome) and when it was asked */}
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', fontSize: 13, color: MUTED }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: pending ? risk.color : '#C4CBD4' }} />
            <span style={{ fontWeight: 600, color: pending ? risk.color : status.color }}>{pending ? risk.label : status.label}</span>
            <span title={new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}>· asked {timeAgo(item.created_at)}</span>
          </p>

          {/* The question */}
          <h2 style={{ fontSize: 22, lineHeight: 1.4, fontWeight: 650, color: INK, letterSpacing: '-0.01em', margin: 0 }}>
            {item.question_raw}
          </h2>

          {/* Why it is here, in one line of plain text */}
          {pending && (
            <p style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '12px 0 0', fontSize: 13.5, lineHeight: 1.55, color: MUTED }}>
              <ShieldAlert size={15} color={risk.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{holdReason(item.risk_level)}</span>
            </p>
          )}

          <div style={{ height: 1, background: LINE, margin: '26px 0 26px' }} />

          {/* The answer, or the editor */}
          {mode === 'edit' && <p style={label}>Edit the answer the operator will receive</p>}
          {mode === 'edit' ? (
            <>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={16}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1px solid #C9D1DB`, borderRadius: 8, fontFamily: F, fontSize: 14, lineHeight: 1.65, color: INK, resize: 'vertical', outlineColor: BLUE }}
              />
              <p style={{ fontSize: 12, color: MUTED, margin: '6px 0 0' }}>Plain text or Markdown. Keep the [SRC-NNN] tags so the citations stay linked.</p>
            </>
          ) : (
            <div className="prose-brand rq-answer" style={{ color: BODY, fontSize: 15, lineHeight: 1.7 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={citationComponents(citations, c => onOpenSource(c.source_id))}>
                {linkCitations(item.answer_text ?? '', citations)}
              </ReactMarkdown>
            </div>
          )}

          {/* Sources */}
          {citations.length > 0 && (
            <section style={{ marginTop: 36 }}>
              <p style={label}>
                Sources <span style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none', color: '#9AA4B2' }}>· {citations.length} · answer confidence {confidence}%</span>
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderBottom: `1px solid ${LINE}` }}>
                {citations.map(c => <SourceRow key={c.source_id} c={c} onOpen={() => onOpenSource(c.source_id)} />)}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Decision bar */}
      <footer style={{ flexShrink: 0, borderTop: `1px solid ${LINE}`, background: pending ? '#fff' : SURFACE, padding: '14px 40px' }} className="rq-decision">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {!pending && (
            <p style={{ margin: 0, fontSize: 13.5, color: status.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.status === 'REJECTED' ? <X size={16} /> : <Check size={16} />}
              {item.status === 'REJECTED'
                ? 'Rejected. The operator sees the reason instead of the answer.'
                : item.status === 'EDIT'
                  ? 'Approved with edits. The operator received the edited answer.'
                  : 'Approved and delivered to the operator.'}
            </p>
          )}

          {pending && mode === 'reject' && (
            <div>
              <label htmlFor="rq-reason" style={{ ...label, display: 'block' }}>Reason for rejecting (the operator will see this)</label>
              <textarea
                id="rq-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                autoFocus
                placeholder="e.g. The recommendation relies on the 2021 survey; the 2024 ILI run supersedes it."
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1px solid #C9D1DB`, borderRadius: 8, fontFamily: F, fontSize: 14, lineHeight: 1.55, color: INK, resize: 'vertical', outlineColor: '#B42318' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button kind="reject" disabled={deciding || reasonTooShort} onClick={() => onDecide({ decision: 'REJECT', reason: reason.trim() })} style={{ background: '#B42318', color: '#fff', borderColor: '#B42318' }}>
                  <X size={15} /> {deciding ? 'Rejecting…' : 'Reject answer'}
                </Button>
                <Button kind="ghost" onClick={() => setMode('idle')}>Cancel</Button>
              </div>
            </div>
          )}

          {pending && mode === 'edit' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button kind="approve" disabled={deciding || editTooShort} onClick={() => onDecide({ decision: 'EDIT', final_text: editText.trim() })}>
                <Check size={15} /> {deciding ? 'Saving…' : 'Approve edited answer'}
              </Button>
              <Button kind="ghost" onClick={() => { setMode('idle'); setEditText(item.answer_text ?? '') }}>Cancel</Button>
            </div>
          )}

          {pending && (mode === 'idle' || mode === 'confirm') && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button kind="approve" disabled={deciding} onClick={approve}>
                <Check size={15} /> {deciding ? 'Approving…' : mode === 'confirm' ? 'Confirm: send to operator' : 'Approve'}
              </Button>
              {mode === 'confirm' ? (
                <>
                  <Button kind="ghost" onClick={() => setMode('idle')}>Cancel</Button>
                  <span style={{ fontSize: 12.5, color: '#B42318' }}>High risk: check the recommendation and its sources first.</span>
                </>
              ) : (
                <>
                  <Button kind="secondary" disabled={deciding} onClick={() => setMode('edit')}><Pencil size={14} /> Edit and approve</Button>
                  <Button kind="reject" disabled={deciding} onClick={() => setMode('reject')}><X size={15} /> Reject</Button>
                </>
              )}
            </div>
          )}
        </div>
      </footer>
    </article>
  )
}
