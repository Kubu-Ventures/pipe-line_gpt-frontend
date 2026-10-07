import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Citation } from './api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Turn a filename like "ILI_Report_SEG-TX-4B_2024.csv" into "ILI Report SEG-TX-4B" */
function shortDocName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')       // strip extension
    .replace(/[_-]+/g, ' ')        // underscores/hyphens → spaces
    .replace(/\s+\d{4}$/, '')      // strip trailing year
    .replace(/\s+Sample$/, '')     // strip "Sample"
    .trim()
}

const CITATION_TAG = /\[((?:SOURCE_ID=)?SRC-\d+(?:\s*,\s*(?:SOURCE_ID=)?SRC-\d+)*)\]/g

/**
 * Replace [SRC-NNN], [SOURCE_ID=SRC-NNN] and list markers like [SRC-001, SRC-004]
 * in text with readable document labels like [ILI Report SEG-TX-4B] drawn from
 * citations. A list citing several parts of one document shows its label once.
 */
export function injectCitationLabels(text: string, citations: Citation[]): string {
  const byId: Record<string, string> = {}
  for (const c of citations) {
    byId[c.source_id] = shortDocName(c.filename)
  }
  return text.replace(CITATION_TAG, (_, list: string) => {
    const labels = list.split(/\s*,\s*/).map(tag => {
      const n = tag.replace('SOURCE_ID=', '').replace('SRC-', '')
      const id = `SRC-${n.padStart(3, '0')}`
      return byId[id] ?? `SRC-${n}`
    })
    return `**[${Array.from(new Set(labels)).join(', ')}]**`
  })
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
