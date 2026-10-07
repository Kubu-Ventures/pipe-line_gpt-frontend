'use client'

import type { ReviewItem } from '@/lib/api'
import { BLUE, F, INK, LINE, MUTED, riskOf, statusOf, timeAgo } from './reviewStyle'

interface QueueListProps {
  items: ReviewItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** The queue as a plain list: the question, then one quiet line of risk and age. */
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
                display: 'block', padding: '16px 20px 16px 17px',
                background: selected ? '#F0F6FC' : 'transparent',
                border: 'none', borderBottom: `1px solid ${LINE}`,
                borderLeft: `3px solid ${selected ? BLUE : 'transparent'}`,
              }}
            >
              <span style={{
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontSize: 14, lineHeight: 1.45, color: pending ? INK : MUTED, fontWeight: pending ? 500 : 400,
              }}>
                {item.question_raw}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, fontSize: 12.5, color: MUTED }}>
                <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: pending ? risk.color : '#C4CBD4', flexShrink: 0 }} />
                {pending ? <span style={{ color: risk.color, fontWeight: 500 }}>{risk.label}</span> : <span style={{ color: status.color }}>{status.label}</span>}
                <span>· {timeAgo(item.created_at)}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
