'use client'

import { useState } from 'react'
import { Download, ChevronDown, ChevronRight, Shield, FileText, AlertTriangle, CheckCircle, XCircle, Upload, LogIn, Settings, Flag } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'

const F = 'Inter, system-ui, sans-serif'

/* ── Event type config: icon, label, colours ── */
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
    color: '#006eb5', bg: '#E8F0F9', border: '#C5D8EF',
    description: e => `AI answered query (${Math.round((e.payload.confidence ?? 0) * 100)}% confidence, ${e.payload.risk_level ?? 'LOW'} risk)${e.payload.question_summary ? ` — "${e.payload.question_summary}"` : ''}`,
  },
  INGEST_COMPLETED: {
    icon: Upload, label: 'Document Ingested',
    color: '#065F46', bg: '#D1FAE5', border: '#6EE7B7',
    description: e => `${e.payload.filename ?? 'Unknown file'} ingested — ${e.payload.chunks?.toLocaleString() ?? '—'} chunks indexed`,
  },
  LOGIN: {
    icon: LogIn, label: 'User Login',
    color: '#4A5568', bg: '#edeff0', border: '#CBD5E0',
    description: e => `Session started${e.payload.mfa ? ' (MFA verified)' : ' (password only)'}`,
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
  target_id: string
  target_type: string
  context: string
  ip_address: string
  created_at: string
  payload: Record<string, any>
}

const MOCK_AUDIT: AuditEvent[] = [
  {
    id: 'ae-001', event_type: 'ANOMALY_ESCALATED',
    actor_id: 'system', target_id: 'seg-4B', target_type: 'segment',
    context: 'Segment 4B', ip_address: '—',
    created_at: '2026-06-27T08:55:00Z',
    payload: { segment: 'Segment 4B', wall_loss: 42, threshold: 40, anomaly: 'External corrosion cluster B2', action_required: 'Immediate FFS assessment before next operation window' },
  },
  {
    id: 'ae-002', event_type: 'HITL_APPROVED',
    actor_id: 'eng.sarah@rosen.com', target_id: 'response-88', target_type: 'response',
    context: 'Segment 4B', ip_address: '10.0.1.45',
    created_at: '2026-06-27T08:42:00Z',
    payload: { risk_level: 'HIGH', confidence: 0.61, segment: 'Segment 4B', question_summary: 'Should we reduce MOP given ILI data for Segment 4B?', final_action: 'Approved — pressure reduction to 72% SMYS ordered', engineer_note: 'Corrosion confirmed in field walkdown last week. Recommendation consistent with ASME B31.8S criteria.' },
  },
  {
    id: 'ae-003', event_type: 'QUERY_COMPLETED',
    actor_id: 'op.james@rosen.com', target_id: 'query-1284', target_type: 'query',
    context: 'PHMSA Dataset', ip_address: '10.0.1.22',
    created_at: '2026-06-27T08:40:12Z',
    payload: { risk_level: 'LOW', confidence: 0.94, hitl_required: false, question_summary: 'PHMSA hazardous liquid incident statistics TX 2015–2023', sources_cited: 2 },
  },
  {
    id: 'ae-004', event_type: 'COMPLIANCE_FLAG',
    actor_id: 'system', target_id: 'hca-07', target_type: 'segment',
    context: 'Mill Creek HCA', ip_address: '—',
    created_at: '2026-06-27T08:00:00Z',
    payload: { regulation: '49 CFR §192.947', obligation: 'Close interval survey (CIS)', segment: 'Mill Creek Crossing (CP-HCA-07)', due_date: '2026-06-30', days_remaining: 3, consequence: 'Non-compliance with IMP schedule — reportable to PHMSA' },
  },
  {
    id: 'ae-005', event_type: 'HITL_REJECTED',
    actor_id: 'eng.sarah@rosen.com', target_id: 'response-87', target_type: 'response',
    context: 'Mill Creek HCA', ip_address: '10.0.1.45',
    created_at: '2026-06-27T06:30:00Z',
    payload: { risk_level: 'MEDIUM', confidence: 0.72, segment: 'Mill Creek HCA', question_summary: 'What maintenance actions for HCA crossings before Q3?', reason: 'Recommendation references 2021 survey data — superseded by 2024 CP findings. Requires updated source before approval.' },
  },
  {
    id: 'ae-006', event_type: 'QUERY_COMPLETED',
    actor_id: 'eng.sarah@rosen.com', target_id: 'query-1283', target_type: 'query',
    context: 'Platform Delta-18', ip_address: '10.0.1.45',
    created_at: '2026-06-27T06:15:44Z',
    payload: { risk_level: 'HIGH', confidence: 0.89, hitl_required: true, question_summary: 'Is Platform Delta-18 safe to operate given latest UT readings?', sources_cited: 3 },
  },
  {
    id: 'ae-007', event_type: 'INGEST_COMPLETED',
    actor_id: 'admin@rosen.com', target_id: 'doc-342', target_type: 'document',
    context: 'PHMSA_2024.zip', ip_address: '10.0.1.10',
    created_at: '2026-06-27T07:15:33Z',
    payload: { filename: 'PHMSA_Hazardous_Liquid_2024.zip', chunks: 1842, dedup_skipped: 0, processing_ms: 44200 },
  },
  {
    id: 'ae-008', event_type: 'HITL_EDITED',
    actor_id: 'eng.marcus@rosen.com', target_id: 'response-86', target_type: 'response',
    context: 'Platform Delta-18', ip_address: '10.0.1.67',
    created_at: '2026-06-26T17:55:00Z',
    payload: { risk_level: 'HIGH', confidence: 0.89, segment: 'Platform Delta-18', question_summary: 'Safe to operate offshore section near Platform Delta?', engineer_note: 'AI recommendation correct. Edited to add explicit derating pressure: 6.8 MPa until FFS complete.' },
  },
  {
    id: 'ae-009', event_type: 'INGEST_COMPLETED',
    actor_id: 'eng.sarah@rosen.com', target_id: 'doc-341', target_type: 'document',
    context: 'Offshore_UT_Survey_PlatformDelta_2026.pdf', ip_address: '10.0.1.45',
    created_at: '2026-06-26T16:40:00Z',
    payload: { filename: 'Offshore_UT_Survey_PlatformDelta_2026.pdf', chunks: 88, dedup_skipped: 0, processing_ms: 8100 },
  },
  {
    id: 'ae-010', event_type: 'LOGIN',
    actor_id: 'op.james@rosen.com', target_id: 'user-12', target_type: 'user',
    context: '—', ip_address: '10.0.1.22',
    created_at: '2026-06-27T06:01:55Z',
    payload: { success: true, mfa: false, session_duration_estimate: '8h' },
  },
  {
    id: 'ae-011', event_type: 'CONFIG_CHANGE',
    actor_id: 'admin@rosen.com', target_id: 'prompt-v3', target_type: 'prompt_template',
    context: 'System', ip_address: '10.0.1.10',
    created_at: '2026-06-26T18:00:00Z',
    payload: { field: 'system_prompt', previous_version: 'v2', version: 'v3', change_summary: 'Added ASME B31.8S section references to corrosion assessment prompts' },
  },
]

const ALL_TYPES = ['All', ...Array.from(new Set(MOCK_AUDIT.map(e => e.event_type)))]

const RISK_STYLE: Record<string, { color: string; bg: string }> = {
  HIGH:   { color: '#991B1B', bg: '#FAE0E0' },
  MEDIUM: { color: '#92400E', bg: '#FEF3C7' },
  LOW:    { color: '#1A7A4A', bg: '#D1FAE5' },
}

function DetailCard({ event }: { event: AuditEvent }) {
  const cfg = EVENT_CONFIG[event.event_type]
  const p = event.payload
  return (
    <div style={{ padding: '16px 24px 20px', borderLeft: `3px solid ${cfg?.color ?? '#006eb5'}`, background: '#fafafa' }}>
      <div style={{ fontFamily: F, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8', marginBottom: 12 }}>
        Event Detail
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px 32px', marginBottom: p.engineer_note || p.reason || p.final_action ? 14 : 0 }}>
        {[
          p.risk_level        && { label: 'Risk Level',        value: p.risk_level,          highlight: true },
          p.confidence        && { label: 'AI Confidence',     value: `${Math.round(p.confidence * 100)}%` },
          p.segment           && { label: 'Pipeline Segment',  value: p.segment },
          p.question_summary  && { label: 'Query',             value: `"${p.question_summary}"` },
          p.sources_cited     && { label: 'Sources Cited',     value: `${p.sources_cited} document chunks` },
          p.filename          && { label: 'File',              value: p.filename },
          p.chunks            && { label: 'Chunks Indexed',    value: p.chunks.toLocaleString() },
          p.regulation        && { label: 'Regulation',        value: p.regulation },
          p.obligation        && { label: 'Obligation',        value: p.obligation },
          p.due_date          && { label: 'Due Date',          value: `${p.due_date} (${p.days_remaining}d remaining)`, highlight: p.days_remaining <= 5 },
          p.anomaly           && { label: 'Anomaly',           value: p.anomaly },
          p.wall_loss         && { label: 'Max Wall Loss',     value: `${p.wall_loss}%`, highlight: p.wall_loss >= 40 },
          p.action_required   && { label: 'Required Action',   value: p.action_required },
          p.field             && { label: 'Changed Field',     value: p.field },
          p.change_summary    && { label: 'Change Summary',    value: p.change_summary },
        ].filter(Boolean).map((f: any, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: f.highlight ? (cfg?.color ?? '#232e3e') : '#232e3e', fontWeight: f.highlight ? 600 : 400 }}>{f.value}</div>
          </div>
        ))}
      </div>

      {(p.engineer_note || p.reason || p.final_action) && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 4 }}>
          {p.engineer_note && (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#232e3e' }}>Engineer note: </strong>{p.engineer_note}
            </p>
          )}
          {p.reason && (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: '#232e3e' }}>Rejection reason: </strong>{p.reason}
            </p>
          )}
          {p.final_action && (
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: p.engineer_note ? '8px 0 0' : 0 }}>
              <strong style={{ color: '#232e3e' }}>Action taken: </strong>{p.final_action}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  const [filterType, setFilterType]   = useState('All')
  const [actorSearch, setActorSearch] = useState('')
  const [expanded, setExpanded]       = useState<string | null>(null)

  const filtered = MOCK_AUDIT.filter(e =>
    (filterType === 'All' || e.event_type === filterType) &&
    (!actorSearch || e.actor_id.toLowerCase().includes(actorSearch.toLowerCase()))
  )

  const hitlCount     = MOCK_AUDIT.filter(e => e.event_type.startsWith('HITL_')).length
  const rejectedCount = MOCK_AUDIT.filter(e => e.event_type === 'HITL_REJECTED').length
  const criticalCount = MOCK_AUDIT.filter(e => ['ANOMALY_ESCALATED', 'COMPLIANCE_FLAG'].includes(e.event_type)).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="audit" />
      <PageHero
        step="Step 5 of 5 · Audit Trail"
        title="Immutable Audit Log"
        subtitle="Complete chain of custody for every AI recommendation, engineer decision, document ingestion, and compliance flag."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Metric strip ── */}
          <div style={{ display: 'flex', background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
            {[
              { value: MOCK_AUDIT.length, label: 'Events Today',         sub: 'Full session recorded',          color: '#232e3e' },
              { value: hitlCount,         label: 'Engineer Decisions',    sub: 'HITL approvals, edits, rejects', color: '#006eb5' },
              { value: rejectedCount,     label: 'Responses Rejected',    sub: 'Returned to AI for correction',  color: rejectedCount > 0 ? '#991B1B' : '#1A7A4A' },
              { value: criticalCount,     label: 'Critical Flags',        sub: 'Anomalies + compliance alerts',  color: criticalCount > 0 ? '#92400E' : '#1A7A4A' },
            ].map((m, i, arr) => (
              <div key={m.label} style={{ flex: 1, padding: '18px 28px', borderRight: i < arr.length - 1 ? '1px solid #d4d6d8' : 'none' }}>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: m.color, lineHeight: 1, marginBottom: 5 }}>{m.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Filter bar ── */}
          <div className="rosen-card filter-bar" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, padding: '16px 20px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            {/* Event type chips */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: 8 }}>Event Type</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['All', 'HITL_APPROVED', 'HITL_REJECTED', 'HITL_EDITED', 'ANOMALY_ESCALATED', 'COMPLIANCE_FLAG', 'QUERY_COMPLETED', 'INGEST_COMPLETED', 'LOGIN', 'CONFIG_CHANGE'].map(t => {
                  const cfg = t !== 'All' ? EVENT_CONFIG[t] : null
                  const active = filterType === t
                  return (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 3, cursor: 'pointer', border: 'none',
                        background: active ? (cfg?.bg ?? '#E8F0F9') : '#edeff0',
                        color: active ? (cfg?.color ?? '#006eb5') : '#6B7280',
                        outline: active ? `1px solid ${cfg?.border ?? '#C5D8EF'}` : 'none',
                        transition: 'all 0.1s',
                      }}
                    >
                      {cfg?.label ?? 'All Events'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actor search + export */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: 6 }}>Actor</div>
                <input
                  type="text" placeholder="Search by email…"
                  value={actorSearch} onChange={e => setActorSearch(e.target.value)}
                  style={{ padding: '7px 10px', border: '1px solid #C8D0DC', borderRadius: 4, fontSize: 13, color: '#232e3e', background: '#FFF', outline: 'none', minWidth: 200 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#006eb5')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#C8D0DC')}
                />
              </div>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#006eb5', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#004A8F')}
                onMouseLeave={e => (e.currentTarget.style.background = '#006eb5')}
              >
                <Download size={14} /> Export for PHMSA Report
              </button>
            </div>
          </div>

          {/* ── Immutability notice ── */}
          <div className="rosen-card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#E8F0F9', border: '1px solid rgba(0,93,170,0.2)', borderRadius: 4, marginBottom: 8, fontSize: 12, color: '#006eb5' }}>
            <Shield size={13} style={{ flexShrink: 0 }} />
            <span>
              <strong>Read-only · Immutable.</strong> Records are protected by PostgreSQL Row Level Security. This log satisfies PHMSA integrity management program documentation requirements under 49 CFR §192.911 and §192.945.
            </span>
          </div>

          {/* ── Event list ── */}
          <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

            {/* Table header */}
            <div className="audit-row-grid" style={{ padding: '10px 20px', background: '#fafafa', borderBottom: '1px solid #d4d6d8' }}>
              {['', 'Event', 'Actor', 'Context', 'Timestamp (UTC)'].map((h, i) => (
                <div key={i} className={i === 3 ? 'audit-col-context' : i === 4 ? 'audit-col-time' : ''} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8' }}>{h}</div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
                <Shield size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>No events match your filters.</p>
              </div>
            ) : (
              filtered.map((event, idx) => {
                const cfg = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG['LOGIN']
                const Icon = cfg.icon
                const isExpanded = expanded === event.id
                const riskLevel = event.payload.risk_level as string | undefined

                return (
                  <div key={event.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #edeff0' : 'none' }}>

                    {/* Row */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : event.id)}
                      className="audit-row-grid"
                      style={{ padding: '13px 20px', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Expand toggle */}
                      <div style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>

                      {/* Event type + description */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 4, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Icon size={13} color={cfg.color} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                            {riskLevel && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: RISK_STYLE[riskLevel]?.color ?? '#374151', background: RISK_STYLE[riskLevel]?.bg ?? '#edeff0', padding: '1px 6px', borderRadius: 2 }}>
                                {riskLevel}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>{cfg.description(event)}</p>
                        </div>
                      </div>

                      {/* Actor */}
                      <div style={{ fontSize: 13, color: event.actor_id === 'system' ? '#9CA3AF' : '#374151', fontStyle: event.actor_id === 'system' ? 'italic' : 'normal', display: 'flex', alignItems: 'center' }}>
                        {event.actor_id}
                      </div>

                      {/* Context */}
                      <div className="audit-col-context" style={{ fontSize: 12, color: '#006eb5', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                        {event.context}
                      </div>

                      {/* Timestamp */}
                      <div className="audit-col-time" style={{ fontFamily: 'monospace', fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                        {new Date(event.created_at).toISOString().replace('T', ' ').slice(0, 19)}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && <DetailCard event={event} />}
                  </div>
                )
              })
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
