'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle, Flag, Edit3, XCircle, Clock } from 'lucide-react'
import { injectCitationLabels } from '@/lib/utils'
import type { Citation } from '@/lib/api'

const THINKING_STAGES = [
  'Searching knowledge base…',
  'Reranking relevant passages…',
  'Generating response…',
]

function ThinkingDots() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1800)
    const t2 = setTimeout(() => setStage(2), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '6px 2px' }}>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%', background: '#006eb5',
              display: 'inline-block',
              animation: `dot-pulse 1.4s ease-in-out ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: '#8896A8', fontStyle: 'italic', animation: 'status-shimmer 2s ease-in-out infinite' }}>
        {THINKING_STAGES[stage]}
      </span>
    </div>
  )
}

export interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isStreaming?: boolean
  hitlRequired?: boolean
  queryStatus?: 'PENDING' | 'PROCESSING' | 'UNDER_REVIEW' | 'DELIVERED' | 'REJECTED'
  reviewDecision?: 'APPROVE' | 'EDIT' | 'REJECT' | null
  reviewReason?: string | null
  timestamp?: Date
  fromHistory?: boolean
  onCitationClick?: (c: Citation) => void
}

function ReviewBadge({ hitlRequired, queryStatus, reviewDecision, reviewReason }: {
  hitlRequired?: boolean
  queryStatus?: string
  reviewDecision?: string | null
  reviewReason?: string | null
}) {
  // Not flagged — low risk, cleared automatically
  if (!hitlRequired) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#1A7A4A', background: '#D1FAE5', border: '1px solid #6EE7B7', padding: '3px 9px', borderRadius: 3 }}>
        <CheckCircle size={10} /> Cleared — no engineer review required
      </span>
    )
  }

  // Flagged — check review outcome
  if (!reviewDecision) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '3px 9px', borderRadius: 3 }}>
        <Clock size={10} /> Pending engineer sign-off · not cleared for operational use
      </span>
    )
  }

  if (reviewDecision === 'APPROVE') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#1A7A4A', background: '#D1FAE5', border: '1px solid #6EE7B7', padding: '3px 9px', borderRadius: 3 }}>
        <CheckCircle size={10} /> Engineer approved · cleared for operational use
      </span>
    )
  }

  if (reviewDecision === 'EDIT') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#1D4ED8', background: '#DBEAFE', border: '1px solid #BFDBFE', padding: '3px 9px', borderRadius: 3 }}>
        <Edit3 size={10} /> Engineer reviewed and edited this response
      </span>
    )
  }

  if (reviewDecision === 'REJECT') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA', padding: '3px 9px', borderRadius: 3 }}>
          <XCircle size={10} /> Rejected by engineer — do not use for operational decisions
        </span>
        {reviewReason && (
          <span style={{ fontSize: '0.6875rem', color: '#991B1B', paddingLeft: 4 }}>
            Reason: {reviewReason}
          </span>
        )}
      </div>
    )
  }

  return null
}

export function MessageBubble({
  role,
  content,
  citations = [],
  isStreaming,
  hitlRequired,
  queryStatus,
  reviewDecision,
  reviewReason,
  timestamp,
  fromHistory,
  onCitationClick,
}: MessageBubbleProps) {
  const isUser = role === 'user'
  const showBadge = !isUser && !isStreaming && hitlRequired !== undefined

  return (
    <div
      className="chat-bubble-pad"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 20,
        padding: '0 24px',
        opacity: fromHistory ? 0.88 : 1,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#232e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6875rem', fontWeight: 700, color: '#4AA8FF' }}>
          AI
        </div>
      )}

      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Bubble */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? '#006eb5' : '#FFFFFF',
            border: isUser ? 'none' : '1px solid #E4E8EF',
            boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
            color: isUser ? '#FFFFFF' : '#232e3e',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          {isUser ? (
            <p style={{ margin: 0 }}>{content}</p>
          ) : isStreaming && !content ? (
            <ThinkingDots />
          ) : (
            <div className={`prose-rosen${isStreaming ? ' stream-cursor' : ''}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {injectCitationLabels(content, citations)}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta row: citations count + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          {!isUser && citations.length > 0 && (
            <button
              onClick={() => citations[0] && onCitationClick?.(citations[0])}
              style={{ fontSize: '0.75rem', color: '#006eb5', fontWeight: 500, background: '#dff0ff', padding: '2px 8px', borderRadius: 3, border: '1px solid rgba(0,93,170,0.15)', cursor: onCitationClick ? 'pointer' : 'default' }}
            >
              {citations.length} source{citations.length !== 1 ? 's' : ''}
            </button>
          )}
          {timestamp && (
            <span style={{ fontSize: '0.75rem', color: '#8896A8' }}>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Review status badge */}
        {showBadge && (
          <div style={{ marginTop: 6 }}>
            <ReviewBadge
              hitlRequired={hitlRequired}
              queryStatus={queryStatus}
              reviewDecision={reviewDecision}
              reviewReason={reviewReason}
            />
          </div>
        )}
      </div>
    </div>
  )
}
