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

/**
 * Replace all [SOURCE_ID=SRC-NNN] and [SRC-NNN] markers in text with
 * a readable document label like [ILI Report SEG-TX-4B] drawn from citations.
 */
export function injectCitationLabels(text: string, citations: Citation[]): string {
  const byId: Record<string, string> = {}
  for (const c of citations) {
    byId[c.source_id] = shortDocName(c.filename)
  }
  return text
    .replace(/\[SOURCE_ID=(SRC-\d+)\]/g, (_, id) =>
      byId[id] ? `**[${byId[id]}]**` : `**[${id}]**`
    )
    .replace(/\[SRC-(\d+)\]/g, (_, n) => {
      const id = `SRC-${String(n).padStart(3, '0')}`
      return byId[id] ? `**[${byId[id]}]**` : `**[SRC-${n}]**`
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
