'use client'

import { useState } from 'react'
import { Loader } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { getChunkText } from '@/lib/api'
import type { Citation } from '@/lib/api'
import { parseRecordFields, prettyFieldName } from '@/lib/utils'

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

function FieldList({ fields, color }: { fields: Array<{ name: string; value: string }>; color: string }) {
  return (
    <div style={{ background: '#F8F9FB', border: '1px solid #E4E8EF', borderLeft: `3px solid ${color}` }}>
      {fields.map(({ name, value }, i) => (
        <div
          key={`${name}-${i}`}
          style={{
            display: 'grid', gridTemplateColumns: 'minmax(110px, 40%) 1fr', gap: 10,
            padding: '5px 10px', fontSize: 12, lineHeight: 1.5,
            borderTop: i ? '1px solid #EDF0F4' : 'none',
          }}
        >
          <span style={{ fontWeight: 600, color: '#55606e' }}>{prettyFieldName(name)}</span>
          <span style={{ color: '#232e3e', wordBreak: 'break-word' }}>{value || '–'}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * The text a citation points to: CSV rows and PHMSA records as field lists,
 * anything else as a passage, with a button to load the full chunk.
 * Render it with `key={citation.source_id}` so a new source starts fresh.
 */
export function SourceRecord({ citation, color }: { citation: Citation; color: string }) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken
  const [fullText, setFullText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadFull() {
    if (!citation.document_id || citation.chunk_index === undefined) return
    setLoading(true)
    try {
      const res = await getChunkText(citation.document_id, citation.chunk_index, token)
      setFullText(res.text_content)
    } catch {
      setFullText(null)
    } finally {
      setLoading(false)
    }
  }

  const text = fullText ?? citation.excerpt ?? ''
  const rows = /\[ROW \d+\]/.test(text) ? parseChunkRows(text) : []
  const record = rows.length ? null : parseRecordFields(text)
  const passage = record ? record.lead : rows.length ? '' : text

  return (
    <div>
      {passage && (
        <p style={{ fontSize: 12.5, color: '#3d4a5c', lineHeight: 1.65, background: '#F8F9FB', border: '1px solid #E4E8EF', borderLeft: `3px solid ${color}`, padding: '10px 12px', marginBottom: record ? 10 : 0 }}>
          {passage}
        </p>
      )}

      {record && <FieldList fields={record.fields} color={color} />}

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(({ row, fields }) => (
            <div key={row}>
              <p style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 4 }}>ROW {row}</p>
              <FieldList fields={Object.entries(fields).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))} color={color} />
            </div>
          ))}
        </div>
      )}

      {!text && <p style={{ fontSize: 12, color: '#8896A8' }}>No excerpt available.</p>}

      {!fullText && citation.document_id && citation.chunk_index !== undefined && (
        <button
          onClick={loadFull}
          disabled={loading}
          style={{
            marginTop: 10, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 0', fontSize: 12, fontWeight: 600,
            color: loading ? '#8896A8' : color,
            background: '#fff', border: '1px solid #E4E8EF',
            borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? <><Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading…</> : 'Show the full retrieved passage'}
        </button>
      )}
    </div>
  )
}
