'use client'

import { X, ExternalLink, FileText, Database, MapPin, BarChart2, File } from 'lucide-react'
import type { Citation } from '@/lib/api'

const F = 'Inter, system-ui, sans-serif'

/* ── Detect source type from filename ───────────────────────── */
function getSourceMeta(filename: string): {
  type: string
  color: string
  bg: string
  icon: React.ElementType
  externalUrl: string | null
  externalLabel: string | null
} {
  const f = filename.toLowerCase()
  if (f.includes('phmsa')) return {
    type: 'PHMSA Dataset',
    color: '#005DAA', bg: '#E8F0F9',
    icon: Database,
    externalUrl: 'https://www.phmsa.dot.gov/data-and-statistics/pipeline/pipeline-incident-flagged-files',
    externalLabel: 'PHMSA Incident Data Portal',
  }
  if (f.endsWith('.pdf')) return {
    type: 'ILI Report (PDF)',
    color: '#B45309', bg: '#FFFBEB',
    icon: FileText,
    externalUrl: null, externalLabel: null,
  }
  if (f.endsWith('.csv') || f.includes('scada')) return {
    type: 'SCADA Export (CSV)',
    color: '#065F46', bg: '#D1FAE5',
    icon: BarChart2,
    externalUrl: null, externalLabel: null,
  }
  if (f.endsWith('.geojson') || f.includes('gis')) return {
    type: 'GIS / GeoJSON',
    color: '#5B21B6', bg: '#EDE9FE',
    icon: MapPin,
    externalUrl: null, externalLabel: null,
  }
  return {
    type: 'Document',
    color: '#374151', bg: '#F3F4F6',
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
          background: 'rgba(0,0,0,0.25)',
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 480,
        background: '#FFFFFF',
        borderLeft: '1px solid #E4E8EF',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        fontFamily: F,
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #E4E8EF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#005DAA', marginBottom: 3 }}>
              Source References
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2A' }}>
              {citations.length} source{citations.length !== 1 ? 's' : ''} cited
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 6, color: '#6B7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close source panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Explainer */}
        <div style={{
          padding: '12px 24px',
          background: '#E8F0F9',
          borderBottom: '1px solid #C5D8EF',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 12, color: '#1A3A5C', lineHeight: 1.55 }}>
            Every AI claim is grounded in these document chunks.
            PHMSA sources link to the public data portal.
            Uploaded documents show the exact passage retrieved.
          </p>
        </div>

        {/* Citations list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {citations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
              <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No citation details available.</p>
            </div>
          ) : (
            citations.map((c, i) => {
              const meta = getSourceMeta(c.filename)
              const Icon = meta.icon
              return (
                <div key={c.source_id ?? i} style={{
                  marginBottom: 16,
                  border: '1px solid #E4E8EF',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>

                  {/* Citation header */}
                  <div style={{
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    borderBottom: '1px solid #E4E8EF',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 4,
                      background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={15} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        {c.source_id && (
                          <span style={{
                            fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                            color: meta.color, background: meta.bg,
                            padding: '1px 6px', borderRadius: 2,
                            letterSpacing: '0.06em',
                          }}>
                            {c.source_id}
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: meta.color, letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          {meta.type}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 13, fontWeight: 600, color: '#1A1A2A',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {c.filename}
                      </p>
                    </div>
                  </div>

                  {/* Page / section metadata */}
                  {(c.page_ref || c.section_label) && (
                    <div style={{
                      padding: '8px 16px',
                      borderBottom: '1px solid #E4E8EF',
                      display: 'flex', gap: 16,
                    }}>
                      {c.page_ref && (
                        <span style={{ fontSize: 12, color: '#6B7280' }}>
                          <strong style={{ color: '#374151' }}>Page:</strong> {c.page_ref}
                        </span>
                      )}
                      {c.section_label && (
                        <span style={{ fontSize: 12, color: '#6B7280' }}>
                          <strong style={{ color: '#374151' }}>Section:</strong> {c.section_label}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Excerpt */}
                  {c.text && (
                    <div style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 6 }}>
                        Retrieved passage
                      </p>
                      <p style={{
                        fontSize: 13, color: '#374151', lineHeight: 1.65,
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
                      padding: '10px 16px',
                      borderTop: '1px solid #E4E8EF',
                      background: '#F8FAFF',
                    }}>
                      <a
                        href={meta.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 600, color: '#005DAA',
                          textDecoration: 'none',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        <ExternalLink size={12} />
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
          padding: '14px 24px',
          borderTop: '1px solid #E4E8EF',
          background: '#FAFAFA',
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>
            All source excerpts are retrieved verbatim from ingested documents.
            PipelineGPT does not modify or summarise source text.
          </p>
        </div>
      </div>
    </>
  )
}
