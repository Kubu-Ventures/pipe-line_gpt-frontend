'use client'

import { X, ExternalLink, FileText, Database, MapPin, BarChart2, File } from 'lucide-react'
import type { Citation } from '@/lib/api'

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
}

export function SourcePanel({ citations, open, onClose }: SourcePanelProps) {
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
            citations.map((c, i) => {
              const meta = getSourceMeta(c.filename)
              const Icon = meta.icon
              return (
                <div key={c.source_id ?? i} style={{
                  marginBottom: 12,
                  border: `1px solid ${meta.borderColor}`,
                  borderLeft: `4px solid ${meta.color}`,
                  overflow: 'hidden',
                }}>

                  {/* Citation header */}
                  <div style={{
                    padding: '11px 14px',
                    background: meta.bg,
                    borderBottom: `1px solid ${meta.borderColor}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    {/* Source type icon */}
                    <div style={{
                      width: 30, height: 30,
                      background: 'rgba(255,255,255,0.6)',
                      border: `1px solid ${meta.borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={14} color={meta.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        {c.source_id && (
                          <span style={{
                            fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                            color: meta.color, background: 'rgba(255,255,255,0.7)',
                            padding: '1px 6px',
                            border: `1px solid ${meta.borderColor}`,
                            letterSpacing: '0.04em',
                          }}>
                            {c.source_id}
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: meta.color, letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          {meta.type}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: F, fontSize: 12, fontWeight: 600, color: DARK,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {c.filename}
                      </p>
                    </div>
                  </div>

                  {/* Page / section metadata */}
                  {(c.page_ref || c.section_label) && (
                    <div style={{
                      padding: '7px 14px',
                      background: '#fafafa',
                      borderBottom: `1px solid #d4d6d8`,
                      display: 'flex', gap: 16, flexWrap: 'wrap',
                    }}>
                      {c.page_ref && (
                        <span style={{ fontFamily: F, fontSize: 12, color: '#55606e' }}>
                          <strong style={{ color: DARK }}>Page:</strong> {c.page_ref}
                        </span>
                      )}
                      {c.section_label && (
                        <span style={{ fontFamily: F, fontSize: 12, color: '#55606e' }}>
                          <strong style={{ color: DARK }}>Section:</strong> {c.section_label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Excerpt */}
                  {c.text && (
                    <div style={{ padding: '12px 14px' }}>
                      <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#a9b1b7', marginBottom: 7 }}>
                        Retrieved passage
                      </p>
                      <p style={{
                        fontFamily: F, fontSize: 12, color: '#55606e', lineHeight: 1.7,
                        borderLeft: `3px solid ${meta.color}`,
                        paddingLeft: 12,
                        fontStyle: 'italic',
                      }}>
                        {c.text}
                      </p>
                    </div>
                  )}

                  {/* External link for PHMSA */}
                  {meta.externalUrl && (
                    <div style={{
                      padding: '9px 14px',
                      borderTop: '1px solid #d4d6d8',
                      background: '#edeff0',
                    }}>
                      <a
                        href={meta.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontFamily: F, fontSize: 12, fontWeight: 600, color: BLUE,
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <ExternalLink size={11} />
                        {meta.externalLabel ?? 'Open source'}
                      </a>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

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
