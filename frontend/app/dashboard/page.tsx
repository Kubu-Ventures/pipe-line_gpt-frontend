'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  IconQueries, IconDocuments, IconReview, IconGauge,
  IconWarning, IconCalendar, IconAnomaly, IconAlarm,
  IconRefresh, IconCheckCircle, IconFileText, IconUpload,
  IconChevronRight, IconArrowRight, IconActivity,
} from './DashboardIcons'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/components/NextStep'
import { getIngestHistory } from '@/lib/api'

const F    = 'Inter, system-ui, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/* ── Types ─────────────────────────────────────────────────────── */
interface Stats {
  total_queries: number
  total_documents: number
  pending_reviews: number
  avg_confidence_pct: number
}

interface AttentionItem {
  type: 'deadline' | 'anomaly' | 'alarm'
  severity: string
  segment?: string
  item?: string
  detail?: string
  date?: string
  days_until?: number
  action_required?: boolean
  source: string
}

interface DocSummary {
  filename: string
  doc_type: string
  summary: string
}

interface TrendPoint { date: string; queries: number }

interface Insights {
  attention_items: AttentionItem[]
  suggested_queries: string[]
  doc_summaries: DocSummary[]
  query_trend: TrendPoint[]
  confidence_distribution: { high: number; medium: number; low: number }
  has_insights: boolean
}

interface DocRecord {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  chunk_count: number
  created_at: string
  uploaded_by?: string | null
}

/* ── Helpers ────────────────────────────────────────────────────── */
const SEVERITY_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  CRITICAL:  { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#DC2626' },
  OVERDUE:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#DC2626' },
  HIGH:      { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', dot: '#EA580C' },
  DUE_SOON:  { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#D97706' },
  MEDIUM:    { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', dot: '#D97706' },
  UPCOMING:  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
  LOW:       { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E' },
}

const TYPE_ICON = {
  deadline: IconCalendar,
  anomaly:  IconAnomaly,
  alarm:    IconAlarm,
}

function severityLabel(item: AttentionItem): string {
  if (item.type === 'alarm') return 'ALARM'
  if (item.severity === 'OVERDUE' || item.severity === 'CRITICAL') return item.severity
  if (item.severity === 'DUE_SOON') return 'DUE SOON'
  return item.severity
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function docTypeLabel(t: string) {
  return { ILI_REPORT: 'ILI Report', SCADA: 'SCADA', IMP_SCHEDULE: 'IMP Schedule', PHMSA: 'PHMSA', OTHER: 'Document' }[t] ?? t
}

function docTypeColor(t: string) {
  return { ILI_REPORT: '#B45309', SCADA: '#065F46', IMP_SCHEDULE: '#5B21B6', PHMSA: BLUE, OTHER: '#55606e' }[t] ?? '#55606e'
}

function formatTrendDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── Component ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role as string | undefined

  const [stats,         setStats]         = useState<Stats | null>(null)
  const [statsError,    setStatsError]    = useState<string | null>(null)
  const [insights,      setInsights]      = useState<Insights | null>(null)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [docs,          setDocs]          = useState<DocRecord[]>([])
  const [docsLoading,   setDocsLoading]   = useState(true)

  const token = (session as any)?.accessToken

  const loadInsights = useCallback(async () => {
    if (!token) return
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const r = await fetch(`${API_URL}/dashboard/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error(`${r.status}`)
      setInsights(await r.json())
    } catch {
      setInsightsError('Could not load document intelligence.')
    } finally {
      setInsightsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    setStatsError(null)
    fetch(`${API_URL}/health/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) { setStatsError(`Backend error ${r.status}`); return null }
        return r.json()
      })
      .then(d => { if (d) setStats(d) })
      .catch(() => setStatsError('Cannot reach backend.'))
  }, [token])

  useEffect(() => { loadInsights() }, [loadInsights])

  useEffect(() => {
    if (!token) return
    setDocsLoading(true)
    getIngestHistory(token)
      .then(d => setDocs(d ?? []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }, [token])

  async function handleRefresh() {
    if (!token || refreshing) return
    setRefreshing(true)
    try {
      await fetch(`${API_URL}/dashboard/insights/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadInsights()
    } finally {
      setRefreshing(false)
    }
  }

  /* ── Metrics strip ─────────────────────────────────────────────── */
  const METRICS = [
    {
      value: stats ? stats.total_queries.toString() : '—',
      label: 'Queries Answered',
      icon: IconQueries,
      color: BLUE,
    },
    {
      value: stats ? stats.total_documents.toString() : '—',
      label: 'Documents Indexed',
      icon: IconDocuments,
      color: '#1A7A4A',
    },
    {
      value: stats ? stats.pending_reviews.toString() : '—',
      label: 'Pending Reviews',
      icon: IconReview,
      color: stats && stats.pending_reviews > 0 ? '#92400E' : '#1A7A4A',
    },
    {
      value: stats ? `${stats.avg_confidence_pct}%` : '—',
      label: 'Avg AI Confidence',
      icon: IconGauge,
      color: !stats ? DARK : stats.avg_confidence_pct >= 75 ? '#1A7A4A' : stats.avg_confidence_pct >= 50 ? '#92400E' : '#991B1B',
    },
  ]

  const attentionItems = insights?.attention_items ?? []
  const suggestedQueries = insights?.suggested_queries ?? []
  const trend = insights?.query_trend ?? []
  const conf = insights?.confidence_distribution ?? { high: 0, medium: 0, low: 0 }
  const confTotal = conf.high + conf.medium + conf.low
  const doneDocs = docs.filter(d => d.status === 'DONE')
  const failedDocs = docs.filter(d => d.status === 'FAILED')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="dashboard" />
      <PageHero
        step="Step 4 of 5 · Analytics"
        title="Integrity Intelligence Dashboard"
        subtitle="Document-driven insights, upcoming deadlines, anomaly flags, and AI-suggested queries — all from your uploaded data."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Backend error */}
          {statsError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderLeft: '3px solid #D97706', borderRadius: 4, padding: '10px 16px', marginBottom: 12, fontSize: 13, color: '#92400E' }}>
              <IconWarning size={14} style={{ flexShrink: 0 }} />
              <span><strong>Live metrics unavailable:</strong> {statsError}</span>
            </div>
          )}

          {/* Metrics strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#d4d6d8', border: '1px solid #d4d6d8', borderRadius: 4, overflow: 'hidden', marginBottom: 24 }}>
            {METRICS.map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} style={{ background: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${m.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={m.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: m.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{m.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Main content grid ── */}
          <div className="grid-2col" style={{ marginBottom: 24 }}>

            {/* ── Attention Required ── */}
            <div style={{ background: '#fff', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 2px' }}>Attention Required</h3>
                  <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>Deadlines, anomalies, and alarms extracted from your documents</p>
                </div>
                {(role === 'ENGINEER' || role === 'ADMIN') && (
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    title="Re-analyse all documents"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: BLUE, background: '#dff0ff', border: '1px solid rgba(0,93,170,0.2)', borderRadius: 4, padding: '5px 10px', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}
                  >
                    <IconRefresh size={12} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                    {refreshing ? 'Analysing…' : 'Re-analyse'}
                  </button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
                {insightsLoading ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#8896A8' }}>
                    <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #d4d6d8', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 10 }} />
                    <p style={{ fontSize: 13 }}>Extracting intelligence from your documents…</p>
                  </div>
                ) : insightsError ? (
                  <div style={{ padding: 24, color: '#92400E', fontSize: 13 }}>{insightsError}</div>
                ) : attentionItems.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#8896A8' }}>
                    <IconCheckCircle size={32} style={{ marginBottom: 10, opacity: 0.4 }} color="#1A7A4A" />
                    <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 6 }}>
                      {docs.filter(d => d.status === 'DONE').length > 0
                        ? 'No issues flagged in your documents'
                        : 'No documents indexed yet'}
                    </p>
                    <p style={{ fontSize: 12, marginBottom: 14 }}>
                      {docs.filter(d => d.status === 'DONE').length > 0
                        ? 'All documents have been analysed — nothing requires immediate attention.'
                        : 'Upload ILI reports, SCADA exports, or load the demo dataset to begin.'}
                    </p>
                    <Link href="/ingest" style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>Go to Ingest →</Link>
                  </div>
                ) : (
                  attentionItems.map((item, i) => {
                    const colors = SEVERITY_COLOR[item.severity] ?? SEVERITY_COLOR.LOW
                    const Icon = TYPE_ICON[item.type]
                    return (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < attentionItems.length - 1 ? '1px solid #edeff0' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: colors.bg, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          <Icon size={14} color={colors.text} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, background: colors.bg, border: `1px solid ${colors.border}`, padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {severityLabel(item)}
                            </span>
                            {item.segment && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{item.segment}</span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: DARK, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item}</p>
                          {item.detail && <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.4 }}>{item.detail}</p>}
                          {item.date && <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{item.date}{item.days_until !== undefined && item.days_until < 0 ? ` · ${Math.abs(item.days_until)} days overdue` : item.days_until !== undefined ? ` · in ${item.days_until} days` : ''}</p>}
                          <p style={{ fontSize: 11, color: '#C0C8D3', margin: '2px 0 0' }}>from {item.source}</p>
                        </div>
                        <Link
                          href={`/chat?q=${encodeURIComponent(`Tell me about the ${item.item} issue${item.segment ? ` on ${item.segment}` : ''} and what action is required.`)}`}
                          style={{ flexShrink: 0, color: BLUE, opacity: 0.6 }}
                          title="Ask the AI about this"
                        >
                          <IconChevronRight size={16} />
                        </Link>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* ── Knowledge Base ── */}
            <div style={{ background: '#fff', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 2px' }}>Indexed Knowledge Base</h3>
                  <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>
                    {docsLoading ? 'Loading…' : doneDocs.length > 0 ? `${doneDocs.length} document${doneDocs.length !== 1 ? 's' : ''} ready for AI queries` : 'No documents indexed yet'}
                  </p>
                </div>
                <Link href="/ingest" style={{ fontSize: 12, fontWeight: 600, color: BLUE, textDecoration: 'none' }}>Manage →</Link>
              </div>

              {/* Doc summaries from AI */}
              {(insights?.doc_summaries ?? []).length > 0 && (
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #edeff0', background: '#FAFBFC' }}>
                  {insights!.doc_summaries.map((ds, i) => (
                    <div key={i} style={{ marginBottom: i < insights!.doc_summaries.length - 1 ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: docTypeColor(ds.doc_type), textTransform: 'uppercase', letterSpacing: '0.06em' }}>{docTypeLabel(ds.doc_type)}</span>
                        <span style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.filename}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.5, margin: 0 }}>{ds.summary}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 260 }}>
                {docsLoading ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#8896A8' }}>
                    <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #d4d6d8', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 10 }} />
                    <p style={{ fontSize: 13 }}>Loading documents…</p>
                  </div>
                ) : docs.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#8896A8' }}>
                    <IconUpload size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p style={{ fontSize: 13, marginBottom: 10 }}>No documents yet</p>
                    <Link href="/ingest" style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>Upload documents →</Link>
                  </div>
                ) : (
                  docs.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((doc, i) => {
                    const isOk = doc.status === 'DONE'
                    const isFail = doc.status === 'FAILED'
                    return (
                      <div key={doc.id} style={{ padding: '10px 20px', borderBottom: i < docs.length - 1 ? '1px solid #edeff0' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconFileText size={14} color={isOk ? BLUE : isFail ? '#991B1B' : '#92400E'} style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{doc.filename}</p>
                          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#9CA3AF' }}>
                            {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
                            <span>{timeAgo(doc.created_at)}</span>
                          </div>
                        </div>
                        {isOk  && <span style={{ fontSize: 10, fontWeight: 700, color: '#1A7A4A', background: '#D1FAE5', padding: '1px 6px', borderRadius: 2, flexShrink: 0 }}>READY</span>}
                        {isFail && <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FEE2E2', padding: '1px 6px', borderRadius: 2, flexShrink: 0 }}>FAILED</span>}
                        {!isOk && !isFail && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: 2, flexShrink: 0 }}>{doc.status}</span>}
                      </div>
                    )
                  })
                )}
              </div>

              {failedDocs.length > 0 && (
                <div style={{ padding: '8px 20px', borderTop: '1px solid #d4d6d8', background: '#FDF4F4', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>{failedDocs.length} document{failedDocs.length !== 1 ? 's' : ''} failed to index</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Smart Query Suggestions ── */}
          {(suggestedQueries.length > 0 || (!insightsLoading && insights?.has_insights)) && (
            <div style={{ background: DARK, padding: '24px 28px', marginBottom: 24, borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ width: 28, height: 2, background: '#ffeb00', marginBottom: 8 }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>AI-Suggested Queries</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                    Generated from analysis of your indexed documents — click any to open in chat
                  </p>
                </div>
                <Link href="/chat" style={{ fontSize: 12, fontWeight: 600, color: '#ffeb00', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Open chat <IconArrowRight size={12} />
                </Link>
              </div>
              {insightsLoading ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Generating suggestions from your documents…</p>
              ) : suggestedQueries.length === 0 ? (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>No suggestions yet — upload and index documents to generate them.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {suggestedQueries.map((q, i) => (
                    <Link
                      key={i}
                      href={`/chat?q=${encodeURIComponent(q)}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 6, padding: '12px 14px', textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    >
                      <IconActivity size={13} color="#60d4f2" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>{q}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Query trend + Confidence ── */}
          <div className="grid-2col" style={{ marginBottom: 24 }}>

            {/* 7-day query trend */}
            <div style={{ background: '#fff', border: '1px solid #d4d6d8', borderRadius: 6, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>Query Activity — Last 7 Days</h3>
              <p style={{ fontSize: 12, color: '#8896A8', margin: '0 0 16px' }}>AI queries answered from your pipeline documents</p>
              {insightsLoading ? (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8896A8', fontSize: 13 }}>Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trend} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EF" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatTrendDate} tick={{ fontSize: 11, fill: '#8896A8' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8896A8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v} queries`, 'Queries']}
                      labelFormatter={formatTrendDate}
                      contentStyle={{ fontSize: 12, border: '1px solid #d4d6d8', borderRadius: 4 }}
                    />
                    <Bar dataKey="queries" fill={BLUE} radius={[3, 3, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Confidence distribution */}
            <div style={{ background: '#fff', border: '1px solid #d4d6d8', borderRadius: 6, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 4px' }}>AI Response Confidence</h3>
              <p style={{ fontSize: 12, color: '#8896A8', margin: '0 0 20px' }}>Distribution across all answered queries</p>

              {confTotal === 0 ? (
                <div style={{ color: '#8896A8', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
                  No queries yet — ask the AI something to see confidence data.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'High confidence', count: conf.high, color: '#1A7A4A', bg: '#D1FAE5' },
                    { label: 'Medium confidence', count: conf.medium, color: '#92400E', bg: '#FEF3C7' },
                    { label: 'Low confidence', count: conf.low, color: '#991B1B', bg: '#FEE2E2' },
                  ].map(row => {
                    const pct = confTotal > 0 ? Math.round((row.count / confTotal) * 100) : 0
                    return (
                      <div key={row.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{row.label}</span>
                          <span style={{ fontSize: 12, color: row.color, fontWeight: 700 }}>{row.count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                  <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    High ≥ 75% · Medium 40–74% · Low &lt; 40% citation coverage
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <NextStep
        href="/audit"
        label="View Audit Trail"
        description="Every query, decision, and ingestion is logged immutably. Export for PHMSA compliance reporting."
      />
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
