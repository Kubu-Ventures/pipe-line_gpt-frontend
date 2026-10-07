'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, BellRing, CalendarClock, MessageSquare } from 'lucide-react'
import { noDashes, tidyCase } from '@/lib/utils'

export interface AttentionItem {
  type: 'deadline' | 'anomaly' | 'alarm'
  severity: string
  segment?: string
  item?: string
  detail?: string
  date?: string
  days_until?: number
  action_required?: boolean
  source: string
}

const F = 'Inter, system-ui, sans-serif'
const INK = '#1F2A37'
const BODY = '#3D4A5C'
const MUTED = '#6B7685'
const LINE = '#E4E8EF'
const BLUE = '#006eb5'

const SEVERITY: Record<string, { label: string; color: string; bg: string }> = {
  CRITICAL: { label: 'Critical', color: '#912018', bg: '#FEE4E2' },
  OVERDUE:  { label: 'Overdue',  color: '#912018', bg: '#FEE4E2' },
  HIGH:     { label: 'High',     color: '#B42318', bg: '#FEF3F2' },
  ALARM:    { label: 'Alarm',    color: '#B54708', bg: '#FFFAEB' },
  DUE_SOON: { label: 'Due soon', color: '#B54708', bg: '#FFFAEB' },
  MEDIUM:   { label: 'Medium',   color: '#B54708', bg: '#FFFAEB' },
  UPCOMING: { label: 'Upcoming', color: '#175CD3', bg: '#EFF8FF' },
  LOW:      { label: 'Low',      color: '#067647', bg: '#ECFDF3' },
}

const TYPE = {
  anomaly:  { label: 'Findings',  icon: AlertTriangle },
  alarm:    { label: 'Alarms',    icon: BellRing },
  deadline: { label: 'Deadlines', icon: CalendarClock },
} as const

function severityOf(item: AttentionItem) {
  return SEVERITY[item.type === 'alarm' ? 'ALARM' : item.severity] ?? SEVERITY.LOW
}

function when(item: AttentionItem) {
  if (!item.date) return ''
  const d = new Date(`${item.date}T00:00:00`)
  const date = isNaN(d.getTime()) ? item.date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (item.days_until === undefined || item.type !== 'deadline') return date
  return item.days_until < 0 ? `${date} · ${Math.abs(item.days_until)} days overdue` : `${date} · in ${item.days_until} days`
}

function askHref(item: AttentionItem) {
  const subject = `${item.item ? tidyCase(noDashes(item.item)) : 'this finding'}${item.segment ? ` (${item.segment})` : ''}`
  return `/chat?q=${encodeURIComponent(`What do the records say about ${subject}?`)}`
}

/** Findings, alarms and deadlines from the documents, as one ranked list with filters. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  const [filter, setFilter] = useState<'all' | AttentionItem['type']>('all')
  const [open, setOpen] = useState<number | null>(null)

  const counts = { anomaly: 0, alarm: 0, deadline: 0 } as Record<AttentionItem['type'], number>
  items.forEach(i => { counts[i.type] = (counts[i.type] ?? 0) + 1 })
  const shown = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <div style={{ fontFamily: F }}>
      <div role="tablist" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
        {(['all', 'anomaly', 'alarm', 'deadline'] as const).map(key => {
          const n = key === 'all' ? items.length : counts[key]
          if (key !== 'all' && n === 0) return null
          const active = filter === key
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => { setFilter(key); setOpen(null) }}
              style={{ fontFamily: F, fontSize: 13, fontWeight: active ? 600 : 500, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: active ? '#E6F1FA' : 'transparent', color: active ? BLUE : MUTED }}
            >
              {key === 'all' ? 'All' : TYPE[key].label} <span style={{ fontWeight: 600, color: active ? BLUE : '#9AA4B2' }}>{n}</span>
            </button>
          )
        })}
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `1px solid ${LINE}` }}>
        {shown.map((item, i) => {
          const sev = severityOf(item)
          const Icon = TYPE[item.type]?.icon ?? AlertTriangle
          const expanded = open === i
          return (
            <li key={`${item.source}-${i}`} style={{ borderBottom: `1px solid ${LINE}` }}>
              <div className="att-row" style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: 16, padding: '14px 4px', alignItems: 'start' }}>
                <span className="att-sev" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: sev.bg, color: sev.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  <Icon size={12} /> {sev.label}
                </span>

                <button
                  onClick={() => setOpen(expanded ? null : i)}
                  aria-expanded={expanded}
                  className="att-main"
                  style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: F, minWidth: 0 }}
                >
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: INK, lineHeight: 1.4 }}>{tidyCase(noDashes(item.item ?? ''))}</span>
                  {item.detail && (
                    <span style={{
                      display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? undefined : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      marginTop: 4, fontSize: 13.5, color: BODY, lineHeight: 1.55,
                    }}>
                      {noDashes(item.detail)}
                    </span>
                  )}
                  <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: MUTED }}>
                    {[item.segment && (item.type === 'alarm' ? item.segment : `Segment ${item.segment}`), when(item), item.source].filter(Boolean).join(' · ')}
                  </span>
                </button>

                <Link href={askHref(item)} className="att-ask" title="Ask PipelineGPT about this" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: BLUE, textDecoration: 'none', whiteSpace: 'nowrap', paddingTop: 2 }}>
                  <MessageSquare size={14} /> Ask about this
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      <style>{`
        .att-row:hover { background: #FAFBFC; }
        @media (max-width: 640px) {
          .att-row { grid-template-columns: 1fr auto !important; gap: 8px 12px !important; }
          .att-sev { grid-column: 1; grid-row: 1; justify-self: start; }
          .att-ask { grid-column: 2; grid-row: 1; }
          .att-main { grid-column: 1 / -1; grid-row: 2; }
        }
      `}</style>
    </div>
  )
}
