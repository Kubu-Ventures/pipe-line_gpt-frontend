'use client'

import { useState } from 'react'
import { X, FileText, ChevronDown, ChevronUp, Loader, Database, BarChart2, MapPin, File } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getChunkText } from '@/lib/api'
import type { Citation } from '@/lib/api'

interface CitationPanelProps {
  citation: Citation | null
  onClose: () => void
}

/** Parse "[ROW N] key: value | key: value | ..." into an array of row objects */
function parseChunkRows(text: string): Array<{ row: number; fields: Record<string, string> }> {
  const rowRegex = /\[ROW (\d+)\]([\s\S]*?)(?=\[ROW \d+\]|$)/g
  const rows: Array<{ row: number; fields: Record<string, string> }> = []
  let m: RegExpExecArray | null
  while ((m = rowRegex.exec(text)) !== null) {
    const rowNum = parseInt(m[1], 10)
    const fields: Record<string, string> = {}
    m[2].split('|').forEach(pair => {
      const colonIdx = pair.indexOf(':')
      if (colonIdx < 0) return
      const k = pair.slice(0, colonIdx).trim()
      const v = pair.slice(colonIdx + 1).trim()
      if (k) fields[k] = v
    })
    if (Object.keys(fields).length) rows.push({ row: rowNum, fields })
  }
  return rows
}

function isCsvChunk(text: string) {
  return /\[ROW \d+\]/.test(text)
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

export function CitationPanel({ citation, onClose }: CitationPanelProps) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken
  const [fullText, setFullText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function loadFull() {
    if (!citation?.document_id || citation.chunk_index === undefined) return
    setLoading(true)
    try {
      const res = await getChunkText(citation.document_id, citation.chunk_index!, token)
      setFullText(res.text_content)
      setExpanded(true)
    } catch {
      setFullText(null)
    } finally {
      setLoading(false)
    }
  }

  const displayText = fullText ?? citation?.excerpt ?? ''
  const rows = isCsvChunk(displayText) ? parseChunkRows(displayText) : []
  const Icon = citation ? sourceIcon(citation.filename) : FileText
  const color = citation ? sourceColor(citation.filename) : '#006eb5'

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px', right: 0, bottom: 0,
        width: '420px',
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
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E8EF', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} color={color} />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#232e3e' }}>Source Reference</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8896A8', padding: 4, display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#232e3e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8896A8')}>
          <X size={18} />
        </button>
      </div>

      {citation && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* Document name */}
          <div style={{ borderLeft: `4px solid ${color}`, paddingLeft: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color, marginBottom: 4 }}>
              {citation.source_id}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#232e3e', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {citation.filename}
            </p>
            {citation.section_label && (
              <p style={{ fontSize: 12, color: '#8896A8', marginTop: 4 }}>
                {citation.section_label}{citation.page_ref ? ` · page ${citation.page_ref}` : ''}
              </p>
            )}
          </div>

          <div style={{ borderTop: '1px solid #E4E8EF', marginBottom: 16 }} />

          {/* Retrieved data */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#8896A8', marginBottom: 10 }}>
            Retrieved Data
          </p>

          {rows.length > 0 ? (
            /* Parsed CSV rows */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map(({ row, fields }) => (
                <div key={row} style={{ border: `1px solid #E4E8EF`, borderLeft: `3px solid ${color}`, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ background: '#F8F9FB', padding: '5px 10px', borderBottom: '1px solid #E4E8EF' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.06em' }}>ROW {row}</span>
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(fields).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: '#55606e', minWidth: 120, flexShrink: 0 }}>{k.replace(/_/g, ' ')}</span>
                        <span style={{ color: '#232e3e', wordBreak: 'break-word' }}>{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Plain text passage */
            <p style={{ fontSize: 13, color: '#4A5568', lineHeight: 1.7, background: '#F8F9FB', border: '1px solid #E4E8EF', borderLeft: `3px solid ${color}`, padding: '12px 14px', fontStyle: 'italic' }}>
              {displayText || 'No excerpt available.'}
            </p>
          )}

          {/* Load full chunk */}
          {!fullText && citation.document_id && citation.chunk_index !== undefined && (
            <button
              onClick={loadFull}
              disabled={loading}
              style={{
                marginTop: 14, width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', fontSize: 12, fontWeight: 600,
                color: loading ? '#8896A8' : color,
                background: '#F8F9FB', border: '1px solid #E4E8EF',
                borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading full data…</> : 'Load full retrieved passage'}
            </button>
          )}

          {/* Note about original file */}
          <div style={{ marginTop: 20, padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 4, fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
            <strong>About this source:</strong> The data above is the exact text chunk the AI used to generate its answer. The original uploaded file is not stored after ingestion — only the indexed text chunks are retained.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
