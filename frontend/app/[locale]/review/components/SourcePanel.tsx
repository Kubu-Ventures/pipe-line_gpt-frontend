'use client'

import { useEffect, useRef } from 'react'
import { X, ExternalLink, FileText, Database, MapPin, BarChart2, File } from 'lucide-react'
import type { Citation } from '@/lib/api'
import { SourceRecord } from '@/components/SourceRecord'
import { citationNumber, sourceHeading } from '@/lib/utils'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'

function getSourceMeta(filename: string): {
  type: string
  color: string
  bg: string
  borderColor: string
  icon: React.ElementType
  externalUrl: string | null
  externalLabel: string | null
} {
  const f = filename.toLowerCase()
  if (f.includes('phmsa')) return {
    type: 'PHMSA Dataset',
    color: BLUE, bg: '#dff0ff', borderColor: '#b8d4f0',
    icon: Database,
    externalUrl: 'https://www.phmsa.dot.gov/data-and-statistics/pipeline/pipeline-incident-flagged-files',
    externalLabel: 'PHMSA Incident Data Portal',
  }
  if (f.endsWith('.pdf')) return {
    type: 'ILI Report (PDF)',
    color: '#B45309', bg: '#FFFBEB', borderColor: '#FDE68A',
    icon: FileText,
    externalUrl: null, externalLabel: null,
  }
  if (f.endsWith('.csv') || f.includes('scada')) return {
    type: 'SCADA Export (CSV)',
    color: '#065F46', bg: '#D1FAE5', borderColor: '#A7F3D0',
    icon: BarChart2,
    externalUrl: null, externalLabel: null,
  }
  if (f.endsWith('.geojson') || f.includes('gis')) return {
    type: 'GIS / GeoJSON',
    color: '#5B21B6', bg: '#EDE9FE', borderColor: '#C4B5FD',
    icon: MapPin,
    externalUrl: null, externalLabel: null,
  }
  return {
    type: 'Document',
    color: '#55606e', bg: '#edeff0', borderColor: '#d4d6d8',
    icon: File,
    externalUrl: null, externalLabel: null,
  }
}

interface SourcePanelProps {
  citations: Citation[]
  open: boolean
  onClose: () => void
  /** Source to highlight and scroll to, e.g. the one whose chip was clicked */
  activeId?: string | null
}

function CitationEntry({ c, meta, active }: { c: Citation; meta: ReturnType<typeof getSourceMeta>; active: boolean }) {
  const heading = sourceHeading(c)
  const ocr = /\(OCR\)$/i.test(c.section_label ?? '')
  const Icon = meta.icon
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [active])

  return (
    <div ref={ref} style={{
      marginBottom: 12, overflow: 'hidden', scrollMarginTop: 12,
      border: `1px solid ${active ? meta.color : meta.borderColor}`, borderLeft: `4px solid ${meta.color}`,
      boxShadow: active ? `0 0 0 2px ${meta.bg}` : 'none',
    }}>
      {/* Header: number, what it is, which file */}
      <div style={{ padding: '11px 14px', background: meta.bg, borderBottom: `1px solid ${meta.borderColor}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          minWidth: 26, height: 26, padding: '0 6px', flexShrink: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F, fontSize: 12, fontWeight: 700, color: '#fff', background: meta.color,
        }}>
          {citationNumber(c.source_id)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: DARK, lineHeight: 1.4 }}>{heading.title}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: F, fontSize: 11, color: '#55606e', marginTop: 3 }}>
            <Icon size={11} color={meta.color} />
            <span style={{ fontWeight: 700, color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>{meta.type}</span>
            <span style={{ wordBreak: 'break-word' }}>{heading.detail}</span>
            {ocr && (
              <span
                title="Text read by OCR from a scanned page. It may contain recognition errors: check the original document for exact figures."
                style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: 2, letterSpacing: '0.06em' }}
              >
                OCR
              </span>
            )}
          </p>
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <SourceRecord key={c.source_id} citation={c} color={meta.color} />
      </div>

      {/* External link */}
      {meta.externalUrl && (
        <div style={{ padding: '9px 14px', borderTop: '1px solid #d4d6d8', background: '#edeff0' }}>
          <a href={meta.externalUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F, fontSize: 12, fontWeight: 600, color: BLUE, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
            <ExternalLink size={11} /> {meta.externalLabel ?? 'Open source'}
          </a>
        </div>
      )}
    </div>
  )
}

export function SourcePanel({ citations, open, onClose, activeId = null }: SourcePanelProps) {
  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(35,46,62,0.40)',
          zIndex: 200,
        }}
      />

      {/* Drawer — UNDP dark header, white body, no border-radius */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480,
        background: '#fff',
        borderLeft: '1px solid #d4d6d8',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.14)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        fontFamily: F,
      }}>

        {/* ── UNDP-style dark header ── */}
        <div style={{
          background: DARK,
          padding: '24px 24px 20px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div>
              <p style={{
                fontFamily: F, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#60d4f2', marginBottom: 6,
              }}>
                Source References
              </p>
              {/* Yellow accent bar */}
              <div style={{ width: 32, height: 2, background: YELLOW, marginBottom: 10 }} />
              <h2 style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: '110%' }}>
                {citations.length} source{citations.length !== 1 ? 's' : ''} cited
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                cursor: 'pointer',
                padding: '6px 8px',
                color: 'rgba(255,255,255,0.70)',
                display: 'flex', alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Explainer strip */}
          <p style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            Every AI claim is grounded in these document chunks. PHMSA sources link to the public data portal.
          </p>
        </div>

        {/* ── Citations list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {citations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#a9b1b7' }}>
              <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontFamily: F, fontSize: 14 }}>No citation details available.</p>
            </div>
          ) : (
            citations.map((c, i) => (
              <CitationEntry key={c.source_id ?? i} c={c} meta={getSourceMeta(c.filename)} active={c.source_id === activeId} />
            ))
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #d4d6d8',
          background: '#edeff0',
          flexShrink: 0,
        }}>
          <p style={{ fontFamily: F, fontSize: 11, color: '#a9b1b7', lineHeight: 1.5 }}>
            All source excerpts are retrieved verbatim from ingested documents. PipelineGPT does not modify source text.
          </p>
        </div>
      </div>
    </>
  )
}
