'use client'

import ReactMarkdown from 'react-markdown'
import type { Citation } from '@/lib/api'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  isStreaming?: boolean
  onCitationClick?: (citation: Citation) => void
}

function CitationChip({
  sourceId,
  citations,
  onClick,
}: {
  sourceId: string
  citations: Citation[]
  onClick: (c: Citation) => void
}) {
  const citation = citations.find((c) => c.source_id === sourceId)
  return (
    <button
      onClick={() => citation && onClick(citation)}
      className="inline-flex items-center font-mono text-xs text-[#4AA8FF] bg-[rgba(29,111,217,0.12)] border border-[#1D6FD9]/25 px-1.5 py-0.5 rounded hover:bg-[rgba(29,111,217,0.22)] transition-colors cursor-pointer"
      title={citation?.filename ?? sourceId}
    >
      [{sourceId}]
    </button>
  )
}

function processContent(
  text: string,
  citations: Citation[],
  onCitationClick: (c: Citation) => void,
): React.ReactNode[] {
  const parts = text.split(/(\[SOURCE_\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[SOURCE_(\d+)\]$/)
    if (match) {
      return (
        <CitationChip
          key={i}
          sourceId={`SOURCE_${match[1]}`}
          citations={citations}
          onClick={onCitationClick}
        />
      )
    }
    return part
  })
}

export function MessageBubble({
  role,
  content,
  citations = [],
  isStreaming = false,
  onCitationClick,
}: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end px-4">
        <div className="max-w-[70%] bg-[#1D6FD9] text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start px-4">
      <div className="max-w-[80%] bg-[#0A1628] border border-[#1C2E4A] rounded-2xl rounded-bl-sm px-4 py-3">
        {citations.length > 0 ? (
          <div className="prose-pipeline text-sm">
            {processContent(content, citations, onCitationClick ?? (() => {}))}
          </div>
        ) : (
          <div className={`prose-pipeline text-sm${isStreaming ? ' cursor-blink' : ''}`}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1C2E4A] flex flex-wrap gap-1.5">
            <span className="text-xs text-[#4A5A72]">Sources:</span>
            {citations.map((c) => (
              <button
                key={c.source_id}
                onClick={() => onCitationClick?.(c)}
                className="text-xs font-mono text-[#4AA8FF] hover:underline"
              >
                [{c.source_id}]
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
