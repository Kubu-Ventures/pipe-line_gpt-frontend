'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Download, ChevronDown, ChevronRight, Shield, FileText,
  AlertTriangle, CheckCircle, XCircle, Upload, LogIn,
  Settings, Flag, UserPlus,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'

const F    = 'Inter, system-ui, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/* ── Event types split by visibility ───────────────────────────────────── */
const OPERATIONAL_EVENT_TYPES = [
  'HITL_APPROVED', 'HITL_REJECTED', 'HITL_EDITED',
  'ANOMALY_ESCALATED', 'COMPLIANCE_FLAG',
  'QUERY_COMPLETED', 'INGEST_COMPLETED',
] as const

const ADMIN_ONLY_EVENT_TYPES = [
  'USER_LOGIN', 'USER_INVITED', 'USER_INVITED_ACCEPTED', 'CONFIG_CHANGE',
] as const

/* ── Color legend ───────────────────────────────────────────────────────── */
const OPERATIONAL_LEGEND = [
  { dot: '#1A7A4A', label: 'Approved · Healthy · Successful' },
  { dot: '#991B1B', label: 'Rejected · Critical · High-risk flag' },
  { dot: '#92400E', label: 'Warning · Compliance flag · Anomaly' },
  { dot: BLUE,     label: 'AI query · Information · Ingestion' },
]
const ADMIN_LEGEND_EXTRA = { dot: '#4A5568', label: 'System event · Login · Config change' }

/* ── Event config ───────────────────────────────────────────────────────── */
const EVENT_CONFIG: Record<string, {
  icon: React.ElementType
  label: string
  color: string
  bg: string
  border: string
  description: (e: AuditEvent) => string
}> = {
  HITL_APPROVED: {
    icon: CheckCircle, label: 'Response Approved',
    color: '#1A7A4A', bg: '#D1FAE5', border: '#6EE7B7',
    description: e => `Engineer approved ${e.payload.risk_level ?? '—'} risk AI response${e.payload.segment ? ` on ${e.payload.segment}` : ''}`,
  },
  HITL_REJECTED: {
    icon: XCircle, label: 'Response Rejected',
    color: '#991B1B', bg: '#FAE0E0', border: '#E8BCBC',
    description: e => `Engineer rejected AI response — "${e.payload.reason ?? 'No reason recorded'}"`,
  },
  HITL_EDITED: {
    icon: FileText, label: 'Response Edited & Approved',
    color: '#1A7A4A', bg: '#D1FAE5', border: '#6EE7B7',
    description: e => `Engineer edited and approved ${e.payload.risk_level ?? '—'} risk response${e.payload.segment ? ` on ${e.payload.segment}` : ''}`,
  },
  ANOMALY_ESCALATED: {
    icon: AlertTriangle, label: 'Anomaly Escalated',
    color: '#92400E', bg: '#FEF3C7', border: '#FDE68A',
    description: e => `AI flagged critical anomaly on ${e.payload.segment ?? '—'} — ${e.payload.wall_loss ?? '—'}% wall loss exceeds ${e.payload.threshold ?? '40'}% action threshold`,
  },
  COMPLIANCE_FLAG: {
    icon: Flag, label: 'Compliance Deadline Flagged',
    color: '#92400E', bg: '#FEF3C7', border: '#FDE68A',
    description: e => `${e.payload.regulation ?? '—'}: ${e.payload.obligation ?? '—'} due in ${e.payload.days_remaining ?? '—'} days`,
  },
  QUERY_COMPLETED: {
    icon: FileText, label: 'Query Answered',
    color: BLUE, bg: '#E8F0F9', border: '#C5D8EF',
    description: e => `AI answered query (${Math.round((e.payload.confidence ?? 0) * 100)}% confidence, ${e.payload.risk_level ?? 'LOW'} risk)${e.payload.question_summary ? ` — "${e.payload.question_summary}"` : ''}`,
  },
  INGEST_COMPLETED: {
    icon: Upload, label: 'Document Ingested',
    color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',
    description: e => `${e.payload.filename ?? 'Unknown file'} ingested — ${e.payload.chunks?.toLocaleString() ?? '—'} chunks indexed`,
  },
  USER_LOGIN: {
    icon: LogIn, label: 'User Login',
    color: '#4A5568', bg: '#edeff0', border: '#CBD5E0',
    description: e => `${e.payload.email ?? e.actor_display} signed in${e.payload.mfa_setup_required ? ' (MFA setup pending)' : ''}`,
  },
  USER_INVITED: {
    icon: UserPlus, label: 'Invitation Sent',
    color: BLUE, bg: '#E8F0F9', border: '#C5D8EF',
    description: e => `Admin invited ${e.payload.email ?? '—'} as ${e.payload.role ?? '—'}`,
  },
  USER_INVITED_ACCEPTED: {
    icon: CheckCircle, label: 'Invitation Accepted',
    color: '#1A7A4A', bg: '#D1FAE5', border: '#6EE7B7',
    description: e => `${e.payload.email ?? '—'} accepted invite and activated account (${e.payload.role ?? '—'})`,
  },
  CONFIG_CHANGE: {
    icon: Settings, label: 'Configuration Changed',
    color: '#5B21B6', bg: '#EDE9FE', border: '#C4B5FD',
    description: e => `System configuration updated — ${e.payload.field ?? 'unknown field'} (${e.payload.version ?? '—'})`,
  },
}

interface AuditEvent {
  id: string
  event_type: string
  actor_id: string
  actor_display: string
  context: string
  ip_address: string
  created_at: string
  payload: Record<string, any>
  isDemo?: boolean
}

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  HIGH:   { color: '#991B1B', bg: '#FAE0E0' },
  MEDIUM: { color: '#92400E', bg: '#FEF3C7' },
  LOW:    { color: '#1A7A4A', bg: '#D1FAE5' },
}

/* ── Demo events ────────────────────────────────────────────────────────── */
const DEMO_OPERATIONAL: AuditEvent[] = [
  {
    id: 'demo-1', event_type: 'ANOMALY_ESCALATED',
    actor_id: 'system', actor_display: 'system', context: 'Segment 4B', ip_address: '—',
    created_at: '2026-06-27T08:55:00Z', isDemo: true,
    payload: { segment: 'Segment 4B', wall_loss: 42, threshold: 40, anomaly: 'External corrosion cluster B2', action_required: 'Immediate FFS assessment before next operation window' },
  },
  {
    id: 'demo-2', event_type: 'HITL_APPROVED',
    actor_id: 'eng.sarah@demo.com', actor_display: 'eng.sarah@demo.com', context: 'Segment 4B', ip_address: '10.0.1.45',
    created_at: '2026-06-27T08:42:00Z', isDemo: true,
    payload: { risk_level: 'HIGH', confidence: 0.61, segment: 'Segment 4B', question_summary: 'Should we reduce MOP given ILI data for Segment 4B?', final_action: 'Approved — pressure reduction to 72% SMYS ordered', engineer_note: 'Corrosion confirmed in field walkdown last week. Recommendation consistent with ASME B31.8S criteria.' },
  },
  {
    id: 'demo-3', event_type: 'QUERY_COMPLETED',
    actor_id: 'op.james@demo.com', actor_display: 'op.james@demo.com', context: 'PHMSA Dataset', ip_address: '10.0.1.22',
    created_at: '2026-06-27T08:40:12Z', isDemo: true,
    payload: { risk_level: 'LOW', confidence: 0.94, hitl_required: false, question_summary: 'PHMSA hazardous liquid incident statistics TX 2015–2023', sources_cited: 2 },
  },
  {
    id: 'demo-4', event_type: 'COMPLIANCE_FLAG',
    actor_id: 'system', actor_display: 'system', context: 'Mill Creek HCA', ip_address: '—',
    created_at: '2026-06-27T08:00:00Z', isDemo: true,
    payload: { regulation: '49 CFR §192.947', obligation: 'Close interval survey (CIS)', segment: 'Mill Creek Crossing (CP-HCA-07)', due_date: '2026-06-30', days_remaining: 2, consequence: 'Non-compliance with IMP schedule — reportable to PHMSA' },
  },
  {
    id: 'demo-5', event_type: 'HITL_REJECTED',
    actor_id: 'eng.sarah@demo.com', actor_display: 'eng.sarah@demo.com', context: 'Mill Creek HCA', ip_address: '10.0.1.45',
    created_at: '2026-06-27T06:30:00Z', isDemo: true,
    payload: { risk_level: 'MEDIUM', confidence: 0.72, segment: 'Mill Creek HCA', question_summary: 'What maintenance actions for HCA crossings before Q3?', reason: 'Recommendation references 2021 survey data — superseded by 2024 CP findings.' },
  },
  {
    id: 'demo-6', event_type: 'INGEST_COMPLETED',
    actor_id: 'admin@demo.com', actor_display: 'admin@demo.com', context: 'PHMSA_2024.zip', ip_address: '10.0.1.10',
    created_at: '2026-06-27T07:15:33Z', isDemo: true,
    payload: { filename: 'PHMSA_Hazardous_Liquid_2024.zip', chunks: 1842, dedup_skipped: 0, processing_ms: 44200 },
  },
  {
    id: 'demo-7', event_type: 'HITL_EDITED',
    actor_id: 'eng.marcus@demo.com', actor_display: 'eng.marcus@demo.com', context: 'Platform Delta-18', ip_address: '10.0.1.67',
    created_at: '2026-06-26T17:55:00Z', isDemo: true,
    payload: { risk_level: 'HIGH', confidence: 0.89, segment: 'Platform Delta-18', question_summary: 'Safe to operate offshore section near Platform Delta?', engineer_note: 'Edited to add explicit derating pressure: 6.8 MPa until FFS complete.' },
  },
]

const DEMO_ADMIN_ONLY: AuditEvent[] = [
  {
    id: 'demo-adm-1', event_type: 'USER_LOGIN',
    actor_id: 'eng.sarah@demo.com', actor_display: 'eng.sarah@demo.com', context: 'eng.sarah@demo.com', ip_address: '10.0.1.45',
    created_at: '2026-06-27T08:30:00Z', isDemo: true,
    payload: { email: 'eng.sarah@demo.com', mfa_setup_required: false },
  },
  {
    id: 'demo-adm-2', event_type: 'USER_LOGIN',
    actor_id: 'op.james@demo.com', actor_display: 'op.james@demo.com', context: 'op.james@demo.com', ip_address: '10.0.1.22',
    created_at: '2026-06-27T08:35:00Z', isDemo: true,
    payload: { email: 'op.james@demo.com', mfa_setup_required: false },
  },
  {
    id: 'demo-adm-3', event_type: 'USER_INVITED',
    actor_id: 'admin@demo.com', actor_display: 'admin@demo.com', context: 'eng.marcus@demo.com', ip_address: '10.0.1.10',
    created_at: '2026-06-26T17:00:00Z', isDemo: true,
    payload: { email: 'eng.marcus@demo.com', role: 'ENGINEER' },
  },
  {
    id: 'demo-adm-4', event_type: 'CONFIG_CHANGE',
    actor_id: 'admin@demo.com', actor_display: 'admin@demo.com', context: 'System', ip_address: '10.0.1.10',
    created_at: '2026-06-26T18:00:00Z', isDemo: true,
    payload: { field: 'system_prompt', previous_version: 'v2', version: 'v3', change_summary: 'Added ASME B31.8S section references to corrosion assessment prompts' },
  },
]

function normaliseBackendEvent(e: any): AuditEvent {
  const payload = e.payload_json ?? {}
  const actorEmail = payload.email as string | undefined
  const context = actorEmail ?? payload.segment ?? payload.filename ?? e.target_id ?? '—'
  return {
    id: e.id,
    event_type: e.event_type,
    actor_id: e.actor_id ?? 'system',
    actor_display: actorEmail ?? e.actor_id ?? 'system',
    context,
    ip_address: e.ip_address ?? '—',
    created_at: e.created_at,
    payload,
    isDemo: false,
  }
}

/* ── Detail expansion card ──────────────────────────────────────────────── */
function DetailCard({ event }: { event: AuditEvent }) {
  const cfg = EVENT_CONFIG[event.event_type]
  const p = event.payload
  const fields = [
    p.risk_level       && { label: 'Risk Level',       value: p.risk_level, highlight: true },
    p.confidence       && { label: 'AI Confidence',    value: `${Math.round(p.confidence * 100)}%` },
    p.segment          && { label: 'Pipeline Segment', value: p.segment },
    p.email            && { label: 'User',             value: p.email },
    p.role             && { label: 'Role',             value: p.role },
    p.question_summary && { label: 'Query',            value: `"${p.question_summary}"` },
    p.sources_cited    && { label: 'Sources Cited',    value: `${p.sources_cited} document chunks` },
    p.filename         && { label: 'File',             value: p.filename },
    p.chunks           && { label: 'Chunks Indexed',   value: p.chunks.toLocaleString() },
    p.regulation       && { label: 'Regulation',       value: p.regulation },
    p.obligation       && { label: 'Obligation',       value: p.obligation },
    p.due_date         && { label: 'Due Date',         value: `${p.due_date} (${p.days_remaining}d remaining)`, highlight: (p.days_remaining ?? 99) <= 5 },
    p.wall_loss        && { label: 'Max Wall Loss',    value: `${p.wall_loss}%`, highlight: p.wall_loss >= 40 },
    p.action_required  && { label: 'Required Action',  value: p.action_required },
    p.field            && { label: 'Changed Field',    value: p.field },
    p.change_summary   && { label: 'Change Summary',   value: p.change_summary },
    p.mfa_setup_required !== undefined && { label: 'MFA Status', value: p.mfa_setup_required ? 'Setup required' : 'Enrolled' },
  ].filter(Boolean) as { label: string; value: string; highlight?: boolean }[]

  return (
    <div style={{ padding: '16px 24px 20px', borderLeft: `3px solid ${cfg?.color ?? BLUE}`, background: '#fafafa' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: 12 }}>
        Event Detail
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px 32px', marginBottom: (p.engineer_note || p.reason || p.final_action) ? 14 : 0 }}>
        {fields.map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: f.highlight ? (cfg?.color ?? DARK) : DARK, fontWeight: f.highlight ? 600 : 400 }}>{f.value}</div>
          </div>
        ))}
      </div>
      {(p.engineer_note || p.reason || p.final_action) && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 4 }}>
          {p.engineer_note && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}><strong style={{ color: DARK }}>Engineer note: </strong>{p.engineer_note}</p>}
          {p.reason        && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}><strong style={{ color: DARK }}>Rejection reason: </strong>{p.reason}</p>}
          {p.final_action  && <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: p.engineer_note ? '8px 0 0' : 0 }}><strong style={{ color: DARK }}>Action taken: </strong>{p.final_action}</p>}
        </div>
      )}
    </div>
  )
}

/* ── Single event row ───────────────────────────────────────────────────── */
function EventRow({ event, expanded, setExpanded, isLast }: {
  event: AuditEvent
  expanded: string | null
  setExpanded: (id: string | null) => void
  isLast: boolean
}) {
  const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG['USER_LOGIN']
  const Icon = cfg.icon
  const isExpanded = expanded === event.id
  const riskLevel = event.payload.risk_level as string | undefined
  const timestamp = new Date(event.created_at).toISOString().replace('T', ' ').slice(0, 19)

  return (
    <div style={{ borderBottom: !isLast ? '1px solid #edeff0' : 'none' }}>
      <div
        onClick={() => setExpanded(isExpanded ? null : event.id)}
        className="a-row"
        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ color: '#9CA3AF', paddingTop: 2 }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 4, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <Icon size={13} color={cfg.color} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
              {riskLevel && (
                <span style={{ fontSize: 10, fontWeight: 700, color: RISK_STYLE[riskLevel]?.color ?? '#374151', background: RISK_STYLE[riskLevel]?.bg ?? '#edeff0', padding: '1px 6px', borderRadius: 2 }}>
                  {riskLevel}
                </span>
              )}
              {event.isDemo && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: '#edeff0', padding: '1px 6px', borderRadius: 2, letterSpacing: '0.06em' }}>
                  DEMO
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cfg.description(event)}
            </p>
            {/* Shown on mobile only (actor + timestamp columns hidden) */}
            <div className="a-mobile-meta">
              <span style={{ color: event.actor_display === 'system' ? '#9CA3AF' : '#374151', fontStyle: event.actor_display === 'system' ? 'italic' : 'normal' }}>
                {event.actor_display}
              </span>
              <span style={{ color: '#9CA3AF', fontFamily: 'monospace' }}>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Desktop-only columns */}
        <div className="a-col-actor" style={{ fontSize: 13, color: event.actor_display === 'system' ? '#9CA3AF' : '#374151', fontStyle: event.actor_display === 'system' ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.actor_display}
        </div>
        <div className="a-col-ctx" style={{ fontSize: 12, color: BLUE, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.context}
        </div>
        <div className="a-col-ts" style={{ fontFamily: 'monospace', fontSize: 12, color: '#9CA3AF' }}>
          {timestamp}
        </div>
      </div>

      {isExpanded && <DetailCard event={event} />}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function AuditPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin = role === 'ADMIN'

  const [filterType,  setFilterType]  = useState('All')
  const [actorSearch, setActorSearch] = useState('')
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [liveEvents,  setLiveEvents]  = useState<AuditEvent[]>([])
  const [liveTotal,   setLiveTotal]   = useState<number | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [fetchError,  setFetchError]  = useState<string | null>(null)
  const [exporting,   setExporting]   = useState(false)

  const filterTypes = [
    'All',
    ...OPERATIONAL_EVENT_TYPES,
    ...(isAdmin ? ADMIN_ONLY_EVENT_TYPES : []),
  ]

  const allDemoEvents = isAdmin
    ? [...DEMO_OPERATIONAL, ...DEMO_ADMIN_ONLY]
    : DEMO_OPERATIONAL

  const fetchEvents = useCallback(async () => {
    if (!session?.accessToken) return
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams({ page: '1', page_size: '100' })
      if (filterType !== 'All') params.set('event_type', filterType)
      if (actorSearch)         params.set('actor_id', actorSearch)

      const res = await fetch(`${API_URL}/audit?${params}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      })
      if (res.status === 401) { setFetchError('Session expired — please sign out and back in.'); return }
      if (!res.ok) { setFetchError(`Backend error ${res.status}`); return }

      const data = await res.json()
      const adminOnlySet = new Set(ADMIN_ONLY_EVENT_TYPES as readonly string[])
      const allowed = (data.items ?? []).filter(
        (e: any) => isAdmin || !adminOnlySet.has(e.event_type)
      )
      setLiveEvents(allowed.map(normaliseBackendEvent))
      setLiveTotal(isAdmin ? (data.total ?? 0) : allowed.length)
    } catch {
      setFetchError('Cannot reach backend — confirm it is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken, filterType, actorSearch])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const filteredDemo = filterType === 'All'
    ? allDemoEvents
    : allDemoEvents.filter(e => e.event_type === filterType)

  const allEvents = [...liveEvents, ...filteredDemo]

  const hitlCount     = allEvents.filter(e => e.event_type.startsWith('HITL_')).length
  const rejectedCount = allEvents.filter(e => e.event_type === 'HITL_REJECTED').length
  const criticalCount = allEvents.filter(e => ['ANOMALY_ESCALATED', 'COMPLIANCE_FLAG'].includes(e.event_type)).length
  const totalLive     = liveTotal ?? liveEvents.length

  async function handleExport() {
    if (!session?.accessToken || exporting) return
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'All') params.set('event_type', filterType)
      const url = `${API_URL}/audit/export?${params}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${session.accessToken}` } })
      if (!res.ok) { alert(`Export failed: ${res.status} — ${await res.text()}`); return }
      const blob = await res.blob()
      const cd   = res.headers.get('Content-Disposition') ?? ''
      const name = cd.match(/filename="?([^"]+)"?/)?.[1] ?? 'pipelinegpt_audit.csv'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } finally {
      setExporting(false)
    }
  }

  const colorLegend = isAdmin
    ? [...OPERATIONAL_LEGEND, ADMIN_LEGEND_EXTRA]
    : OPERATIONAL_LEGEND

  /* CSS class names are prefixed "a-" to avoid collisions */
  const css = `
    .a-row {
      display: grid;
      grid-template-columns: 28px 1fr 180px 160px 160px;
      gap: 0 16px;
      align-items: center;
      padding: 13px 20px;
      cursor: pointer;
    }
    .a-hdr {
      display: grid;
      grid-template-columns: 28px 1fr 180px 160px 160px;
      gap: 0 16px;
      align-items: center;
      padding: 10px 20px;
      background: #fafafa;
      border-bottom: 1px solid #d4d6d8;
    }
    .a-mobile-meta { display: none; }
    .a-metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      background: #FFFFFF;
      border: 1px solid #d4d6d8;
      border-radius: 4px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    .a-metric {
      padding: 18px 28px;
    }
    .a-metric + .a-metric { border-left: 1px solid #d4d6d8; }
    .a-filterbar {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      align-items: flex-end;
    }
    .a-search-grp {
      display: flex;
      align-items: flex-end;
      gap: 10px;
    }
    .a-search-input {
      padding: 7px 10px;
      border: 1px solid #C8D0DC;
      border-radius: 4px;
      font-size: 13px;
      color: #232e3e;
      background: #FFF;
      outline: none;
      min-width: 200px;
    }
    @media (max-width: 900px) {
      .a-metric { padding: 14px 18px; }
    }
    @media (max-width: 768px) {
      .a-metrics { grid-template-columns: repeat(2, 1fr); }
      .a-metric { padding: 14px 16px; }
      .a-metric:nth-child(1), .a-metric:nth-child(2) { border-bottom: 1px solid #d4d6d8; }
      .a-row { grid-template-columns: 28px 1fr; gap: 0 8px; padding: 11px 12px; align-items: flex-start; }
      .a-hdr { grid-template-columns: 28px 1fr; gap: 0 8px; padding: 8px 12px; }
      .a-col-actor, .a-col-ctx, .a-col-ts { display: none; }
      .a-mobile-meta { display: flex; gap: 10px; margin-top: 5px; font-size: 11px; flex-wrap: wrap; }
      .a-filterbar { gap: 16px; }
      .a-search-grp { flex-direction: column; align-items: stretch; gap: 8px; }
      .a-search-input { min-width: unset; width: 100%; box-sizing: border-box; }
    }
    @media (max-width: 480px) {
      .a-metric { padding: 12px 12px; }
    }
  `

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <TopNav activeTab="audit" />
      <PageHero
        step="Step 5 of 5 · Audit Trail"
        title="Immutable Audit Log"
        subtitle={
          isAdmin
            ? 'Full system log — AI decisions, engineer reviews, user management, and configuration changes.'
            : 'Operational audit trail — AI recommendations, engineer reviews, anomaly flags, and compliance events.'
        }
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Color legend */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 20px',
            background: '#fff', border: '1px solid #d4d6d8', borderRadius: 4,
            padding: '10px 18px', marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>
              Colour key
            </span>
            {colorLegend.map(({ dot, label }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>

          {/* Role notice for engineers */}
          {!isAdmin && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#E8F0F9', border: '1px solid rgba(0,110,181,0.25)',
              borderRadius: 4, padding: '8px 16px', marginBottom: 8,
              fontSize: 12, color: BLUE,
            }}>
              <Shield size={13} style={{ flexShrink: 0 }} />
              <span>
                Showing <strong>operational events only</strong> — AI queries, engineer decisions, anomaly alerts, and compliance flags.
                User login and system events are visible to admins only.
              </span>
            </div>
          )}

          {/* Backend error */}
          {fetchError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#FEF3C7', border: '1px solid #FDE68A', borderLeft: '3px solid #D97706',
              borderRadius: 4, padding: '10px 16px', marginBottom: 8, fontSize: 13, color: '#92400E',
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Could not load live events:</strong> {fetchError}</span>
            </div>
          )}

          {/* Metric strip */}
          <div className="a-metrics">
            {[
              { value: totalLive,     label: 'Live Events',        sub: isAdmin ? 'All events in database' : 'Operational events in database', color: DARK },
              { value: hitlCount,     label: 'Engineer Decisions', sub: 'HITL approvals, edits, rejects',  color: BLUE },
              { value: rejectedCount, label: 'Responses Rejected', sub: 'Returned for correction',          color: rejectedCount > 0 ? '#991B1B' : '#1A7A4A' },
              { value: criticalCount, label: 'Critical Flags',     sub: 'Anomalies + compliance alerts',    color: criticalCount > 0 ? '#92400E' : '#1A7A4A' },
            ].map(m => (
              <div key={m.label} className="a-metric">
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: m.color, lineHeight: 1, marginBottom: 5 }}>
                  {loading ? '—' : m.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, padding: '16px 20px', marginBottom: 8 }}>
            <div className="a-filterbar">
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: 8 }}>Event Type</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {filterTypes.map(t => {
                    const cfg = t !== 'All' ? EVENT_CONFIG[t] : null
                    const active = filterType === t
                    const isAdminType = ADMIN_ONLY_EVENT_TYPES.includes(t as any)
                    return (
                      <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        style={{
                          fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 3,
                          cursor: 'pointer', border: isAdminType ? '1px dashed #CBD5E0' : 'none',
                          background: active ? (cfg?.bg ?? '#E8F0F9') : '#edeff0',
                          color: active ? (cfg?.color ?? BLUE) : '#6B7280',
                          outline: active ? `1px solid ${cfg?.border ?? '#C5D8EF'}` : 'none',
                          transition: 'all 0.1s',
                        }}
                        title={isAdminType ? 'Admin-only event type' : undefined}
                      >
                        {cfg?.label ?? 'All Events'}
                        {isAdminType && <span style={{ marginLeft: 4, opacity: 0.5, fontSize: 10 }}>🔒</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="a-search-grp">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: 6 }}>Actor email</div>
                  <input
                    type="text"
                    placeholder="Search by email…"
                    value={actorSearch}
                    onChange={e => setActorSearch(e.target.value)}
                    className="a-search-input"
                    onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                    onBlur={e  => (e.currentTarget.style.borderColor = '#C8D0DC')}
                  />
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', background: exporting ? '#9CA3AF' : BLUE,
                    border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600,
                    color: '#FFF', cursor: exporting ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = '#004A8F' }}
                  onMouseLeave={e => { if (!exporting) e.currentTarget.style.background = BLUE }}
                  title={isAdmin ? 'Download full audit log as CSV' : 'Download operational events as CSV'}
                >
                  <Download size={14} />
                  {exporting ? 'Preparing…' : 'Export for PHMSA Report'}
                </button>
              </div>
            </div>
          </div>

          {/* Export info strip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', background: '#F8F9FB', border: '1px solid #d4d6d8',
            borderRadius: 4, marginBottom: 8, fontSize: 12, color: '#6B7280',
          }}>
            <FileText size={13} style={{ flexShrink: 0, color: BLUE }} />
            <span>
              CSV includes: Event ID · Timestamp · Category · Actor · Segment · AI Confidence · Risk Level · Decision · Regulatory Reference.
              {isAdmin
                ? ' Admin export includes all event types including user access logs.'
                : ' Your export covers operational events only — anomalies, decisions, queries, and ingestion.'}
            </span>
          </div>

          {/* Immutability notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', background: '#E8F0F9', border: '1px solid rgba(0,93,170,0.2)',
            borderRadius: 4, marginBottom: 8, fontSize: 12, color: BLUE,
          }}>
            <Shield size={13} style={{ flexShrink: 0 }} />
            <span>
              <strong>Read-only · Immutable.</strong> Records are protected by PostgreSQL Row Level Security.
              Satisfies PHMSA IMP documentation requirements under 49 CFR §192.911 and §192.945.
            </span>
          </div>

          {/* Event list */}
          <div style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            {/* Column header */}
            <div className="a-hdr">
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }} />
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }}>Event</div>
              <div className="a-col-actor" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }}>Actor</div>
              <div className="a-col-ctx" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }}>Context</div>
              <div className="a-col-ts" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }}>Timestamp (UTC)</div>
            </div>

            {loading && liveEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF' }}>
                <p style={{ fontSize: 14 }}>Loading audit log…</p>
              </div>
            ) : allEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <Shield size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>No events match your filters.</p>
              </div>
            ) : (
              <>
                {liveEvents.length > 0 && (
                  <div style={{ padding: '6px 20px', background: '#F0FDF4', borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A7A4A', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1A7A4A', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Live — {totalLive} event{totalLive !== 1 ? 's' : ''} from database
                    </span>
                  </div>
                )}
                {liveEvents.map((event, idx) => (
                  <EventRow
                    key={event.id} event={event}
                    expanded={expanded} setExpanded={setExpanded}
                    isLast={idx === liveEvents.length - 1 && filteredDemo.length === 0}
                  />
                ))}

                {filteredDemo.length > 0 && (
                  <div style={{ padding: '6px 20px', background: '#F8F9FB', borderTop: liveEvents.length > 0 ? '1px solid #d4d6d8' : undefined, borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9CA3AF', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      Sample pipeline events — shown until AI query data is available
                    </span>
                  </div>
                )}
                {filteredDemo.map((event, idx) => (
                  <EventRow
                    key={event.id} event={event}
                    expanded={expanded} setExpanded={setExpanded}
                    isLast={idx === filteredDemo.length - 1}
                  />
                ))}
              </>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
