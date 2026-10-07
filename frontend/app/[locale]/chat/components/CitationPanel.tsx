'use client'

import { X, FileText, Database, BarChart2, MapPin } from 'lucide-react'
import type { Citation } from '@/lib/api'
import { SourceRecord } from '@/components/SourceRecord'
import { citationNumber, sourceHeading } from '@/lib/utils'

interface CitationPanelProps {
  /** The source being shown, or null when the panel is closed */
  citation: Citation | null
  /** Every source cited by the same answer, for switching between them */
  citations: Citation[]
  onSelect: (c: Citation) => void
  onClose: () => void
}

function sourceIcon(filename: string) {
  const f = filename.toLowerCase()
  if (f.includes('phmsa') || f.includes('incident')) return Database
  if (f.includes('scada')) return BarChart2
  if (f.includes('gis') || f.endsWith('.geojson')) return MapPin
  return FileText
}

function sourceColor(filename: string) {
  const f = filename.toLowerCase()
  if (f.includes('phmsa') || f.includes('incident')) return '#006eb5'
  if (f.includes('scada')) return '#065F46'
  if (f.includes('ili') || f.endsWith('.pdf')) return '#B45309'
  if (f.includes('integrity') || f.includes('imp')) return '#5B21B6'
  return '#55606e'
}

function NumberBadge({ n, color, active = true, size = 22 }: { n: number; color: string; active?: boolean; size?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: size, height: size, padding: '0 6px', borderRadius: 4, flexShrink: 0,
      fontSize: size > 22 ? 12 : 11, fontWeight: 700,
      color: active ? '#fff' : color,
      background: active ? color : '#dff0ff',
      border: `1px solid ${active ? color : 'rgba(0,93,170,0.18)'}`,
    }}>
      {n}
    </span>
  )
}

export function CitationPanel({ citation, citations, onSelect, onClose }: CitationPanelProps) {
  const Icon = citation ? sourceIcon(citation.filename) : FileText
  const color = citation ? sourceColor(citation.filename) : '#006eb5'
  const heading = citation ? sourceHeading(citation) : null
  const sources = citations.length ? citations : citation ? [citation] : []

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px', right: 0, bottom: 0,
        width: '440px', maxWidth: '100vw',
        background: '#FFFFFF',
        borderLeft: '1px solid #E4E8EF',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
        zIndex: 40,
        display: 'flex', flexDirection: 'column',
        transform: citation ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E8EF', background: '#F8F9FB', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon size={16} color={color} />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#232e3e' }}>
              {sources.length > 1 ? `Sources for this answer (${sources.length})` : 'Source'}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896A8', padding: 4, display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#232e3e')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}>
            <X size={18} />
          </button>
        </div>

        {/* One tab per cited source */}
        {sources.length > 1 && (
          <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {sources.map(c => {
              const active = c.source_id === citation?.source_id
              return (
                <button
                  key={c.source_id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(c)}
                  title={sourceHeading(c).title}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <NumberBadge n={citationNumber(c.source_id)} color={sourceColor(c.filename)} active={active} size={24} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {citation && heading && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

          {/* What this source is */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}>
            <NumberBadge n={citationNumber(citation.source_id)} color={color} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#232e3e', lineHeight: 1.4 }}>{heading.title}</p>
              <p style={{ fontSize: 11.5, color: '#8896A8', marginTop: 3, wordBreak: 'break-word' }}>{heading.detail}</p>
            </div>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#8896A8', marginBottom: 8 }}>
            What the answer drew on
          </p>
          <SourceRecord key={citation.source_id} citation={citation} color={color} />

          <p style={{ marginTop: 18, fontSize: 11.5, color: '#8896A8', lineHeight: 1.55 }}>
            This is the exact text the answer was generated from. The original uploaded file isn&apos;t kept after ingestion, only its indexed text.
          </p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
