import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Citation } from './api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Turn a filename like "ILI_Report_SEG-TX-4B_2024.csv" into "ILI Report SEG-TX-4B" */
export function shortDocName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')       // strip extension
    .replace(/[_-]+/g, ' ')        // underscores/hyphens → spaces
    .replace(/\s+\d{4}$/, '')      // strip trailing year
    .replace(/\s+Sample$/, '')     // strip "Sample"
    .trim()
}

const CITATION_TAG = /\[((?:SOURCE_ID=)?SRC-\d+(?:\s*,\s*(?:SOURCE_ID=)?SRC-\d+)*)\]/g

/** Link target for a citation marker; `CitationChip` turns these links into buttons. */
export const CITE_HREF_PREFIX = '#cite-'

/**
 * Replace [SRC-NNN], [SOURCE_ID=SRC-NNN] and list markers like [SRC-001, SRC-004]
 * in markdown with numbered links ([1](#cite-SRC-001)), one per cited source, which
 * `CitationChip` renders as clickable chips. Ids with no matching citation stay as text.
 */
export function linkCitations(text: string, citations: Citation[]): string {
  const known = new Set(citations.map(c => c.source_id))
  return text.replace(CITATION_TAG, (_, list: string) =>
    Array.from(new Set(list.split(/\s*,\s*/).map(tag => tag.replace('SOURCE_ID=', ''))))
      .map(tag => {
        const n = Number(tag.replace('SRC-', ''))
        const id = `SRC-${String(n).padStart(3, '0')}`
        return known.has(id) ? `[${n}](${CITE_HREF_PREFIX}${id})` : `[${tag}]`
      })
      .join('')
  )
}

/** The first `length` characters of a markdown answer, without a citation marker cut in half. */
export function previewText(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).replace(/\[[^\]]*$/, '')
}

/** The number a source is shown with: SRC-006 → 6, matching its citation chip. */
export function citationNumber(sourceId: string): number {
  return Number(sourceId.replace(/\D/g, '')) || 0
}

/**
 * What tells a source apart from the others. A PHMSA incident label
 * ("22 Jun 2024 · Pawnee County, OK · Excavation damage · Report 20240093") is the
 * heading and the file goes underneath; otherwise the document name is the heading
 * and the section or page goes underneath.
 */
export function sourceHeading(c: Citation): { title: string; detail: string } {
  const label = c.section_label ?? ''
  if (label.includes(' · ')) return { title: label, detail: c.filename }
  const page = c.page_ref && !/^page\b/i.test(label) ? `page ${c.page_ref}` : ''
  const where = [label, page].filter(Boolean).join(' · ')
  return { title: shortDocName(c.filename), detail: [c.filename, where].filter(Boolean).join(' · ') }
}

const FIELD_ACRONYMS: Record<string, string> = {
  Maop: 'MAOP', Psig: 'psig', Smys: 'SMYS', Nrc: 'NRC', Emt: 'EMT', Hca: 'HCA', Cfr: 'CFR',
  Erw: 'ERW', Ili: 'ILI', Scada: 'SCADA', Phmsa: 'PHMSA', Mop: 'MOP', Id: 'ID', Ind: '',
}

/** "Maop Psig" → "MAOP psig", "Shutdown Due Accident Ind" → "Shutdown Due Accident". */
export function prettyFieldName(name: string): string {
  return name.split(' ').map(w => FIELD_ACRONYMS[w] ?? w).filter(Boolean).join(' ')
}

// A field name as the PHMSA loader writes it: capitalised words ending in ": ", e.g. "Local Datetime: "
const RECORD_FIELD = /(?:^|\s)([A-Z][a-z0-9]+(?: [A-Za-z][a-z0-9]*){0,5}):\s/g

/**
 * Split a record passage ("Report Number: 20240093 Local Datetime: 6/22/2024 10:27 ...")
 * into fields. Text before the first field (a narrative continuation) is returned as
 * `lead`. Returns null when the passage doesn't look like a record.
 */
export function parseRecordFields(text: string): { lead: string; fields: Array<{ name: string; value: string }> } | null {
  const body = text.replace(/^PHMSA Incident \[\d{4}\]:\s*/, '')
  const matches = Array.from(body.matchAll(RECORD_FIELD))
  if (matches.length < 3) return null
  const fields = matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index ?? body.length : body.length
    return { name: m[1], value: body.slice(start, end).trim().replace(/\.$/, '') }
  })
  return { lead: body.slice(0, matches[0].index ?? 0).trim(), fields }
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}
