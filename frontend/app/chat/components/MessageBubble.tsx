'use client'

import ReactMarkdown from 'react-markdown'
import { CheckCircle, Flag } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Citation } from '@/lib/api'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isStreaming?: boolean
  hitlRequired?: boolean
  timestamp?: Date
  onCitationClick?: (c: Citation) => void
}

function renderWithCitations(
  text: string,
  citations: Citation[],
  onCitationClick: (c: Citation) => void
) {
  const parts = text.split(/(\[SOURCE_\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/\[SOURCE_(\d+)\]/)
    if (match) {
      const idx = parseInt(match[1], 10) - 1
      const citation = citations[idx]
      return (
        <button
          key={i}
          className="citation-chip"
          onClick={() => citation && onCitationClick(citation)}
          title={citation?.filename ?? part}
        >
          {part}
        </button>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function MessageBubble({
  role,
  content,
  citations = [],
  isStreaming,
  hitlRequired,
  timestamp,
  onCitationClick,
}: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className="chat-bubble-pad"
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '10px',
        marginBottom: '20px',
        padding: '0 24px',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#232e3e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: '#4AA8FF',
            letterSpacing: '0',
          }}
        >
          AI
        </div>
      )}

      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
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
            position: 'relative',
          }}
        >
          {isUser ? (
            <p style={{ margin: 0 }}>{content}</p>
          ) : (
            <div className={`prose-rosen${isStreaming ? ' stream-cursor' : ''}`}>
              {citations.length > 0 && onCitationClick ? (
                <div>{renderWithCitations(content, citations, onCitationClick)}</div>
              ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Citation count + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
          {!isUser && citations.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#006eb5',
                fontWeight: 500,
                background: '#dff0ff',
                padding: '2px 8px',
                borderRadius: '3px',
                border: '1px solid rgba(0,93,170,0.15)',
              }}
            >
              {citations.length} source{citations.length !== 1 ? 's' : ''}
            </span>
          )}
          {timestamp && (
            <span style={{ fontSize: '0.75rem', color: '#8896A8' }}>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Inline approval status — only on completed AI messages with an explicit flag */}
        {!isUser && !isStreaming && hitlRequired !== undefined && (
          <div style={{ marginTop: '6px' }}>
            {hitlRequired ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.6875rem', fontWeight: 600,
                color: '#92400E', background: '#FEF3C7',
                border: '1px solid #FDE68A',
                padding: '3px 9px', borderRadius: '3px',
              }}>
                <Flag size={10} />
                Flagged · Pending engineer sign-off before operational use
              </span>
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.6875rem', fontWeight: 600,
                color: '#1A7A4A', background: '#D1FAE5',
                border: '1px solid #6EE7B7',
                padding: '3px 9px', borderRadius: '3px',
              }}>
                <CheckCircle size={10} />
                Cleared — no review required
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
