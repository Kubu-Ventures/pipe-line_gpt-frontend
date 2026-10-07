'use client'

import type { ReviewItem } from '@/lib/api'
import { BLUE, F, INK, LINE, MUTED, riskOf, statusOf, timeAgo } from './reviewStyle'

interface QueueListProps {
  items: ReviewItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** The queue as a plain list: one row per answer, separated by hairlines. */
export function QueueList({ items, selectedId, onSelect }: QueueListProps) {
  return (
    <ul role="listbox" aria-label="Review queue" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map(item => {
        const risk = riskOf(item.risk_level)
        const status = statusOf(item.status)
        const selected = item.id === selectedId
        const pending = item.status === 'PENDING'
        return (
          <li key={item.id} role="option" aria-selected={selected}>
            <button
              onClick={() => onSelect(item.id)}
              className="rq-row"
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: F,
                display: 'block', padding: '14px 18px 14px 16px',
                background: selected ? '#F0F6FC' : 'transparent',
                border: 'none', borderBottom: `1px solid ${LINE}`,
                borderLeft: `3px solid ${selected ? BLUE : 'transparent'}`,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12 }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: risk.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: risk.color }}>{risk.label}</span>
                {!pending && <span style={{ color: status.color, fontWeight: 500 }}>· {status.label}</span>}
                <span style={{ marginLeft: 'auto', color: MUTED, whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</span>
              </span>
              <span style={{
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontSize: 14, lineHeight: 1.45, color: pending ? INK : MUTED, fontWeight: pending ? 500 : 400,
              }}>
                {item.question_raw}
              </span>
              <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: MUTED }}>
                Confidence {Math.round(item.confidence_score * 100)}% · {item.citations_json?.length ?? 0} source{(item.citations_json?.length ?? 0) === 1 ? '' : 's'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
