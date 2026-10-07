/** Shared look for the review page. */

export const F = 'Inter, system-ui, sans-serif'
export const BLUE = '#006eb5'
export const INK = '#1F2A37'
export const BODY = '#3D4A5C'
export const MUTED = '#6B7685'
export const LINE = '#E4E8EF'
export const SURFACE = '#F7F8FA'

export const RISK = {
  HIGH:   { label: 'High risk',   color: '#B42318', bg: '#FEF3F2' },
  MEDIUM: { label: 'Medium risk', color: '#B54708', bg: '#FFFAEB' },
  LOW:    { label: 'Low risk',    color: '#067647', bg: '#ECFDF3' },
} as const

export const STATUS = {
  PENDING:  { label: 'Awaiting review', color: '#B54708' },
  APPROVED: { label: 'Approved',        color: '#067647' },
  EDIT:     { label: 'Approved with edits', color: '#067647' },
  REJECTED: { label: 'Rejected',        color: '#B42318' },
} as const

export function riskOf(level: string) {
  return RISK[level as keyof typeof RISK] ?? RISK.LOW
}

export function statusOf(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? { label: status, color: MUTED }
}

/** Why the answer was held, in the terms of the backend's risk rules (services/hitl.py). */
export function holdReason(level: string): string {
  if (level === 'HIGH') return 'Held because it recommends an operational action (such as a repair, shutdown or pressure reduction) or reports harm to people.'
  if (level === 'MEDIUM') return 'Held because it recommends maintenance, inspection or HCA work, or its sources back it with low confidence.'
  return 'Held for a second look.'
}

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return `${Math.floor(hrs / 24)} d ago`
}
