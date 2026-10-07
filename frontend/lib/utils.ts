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
