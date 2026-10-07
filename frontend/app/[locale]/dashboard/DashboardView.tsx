'use client'

import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, RefreshCw } from 'lucide-react'
import { PageBand } from '@/components/PageBand'
import type { DocumentItem, DocumentPage } from '@/lib/api'
import { noDashes } from '@/lib/utils'
import { AttentionList, type AttentionItem } from './AttentionList'

const F     = 'Inter, system-ui, sans-serif'
const BLUE  = '#006eb5'
const INK   = '#1F2A37'
const BODY  = '#3D4A5C'
const MUTED = '#6B7685'
const LINE  = '#E4E8EF'

/* ── Types ─────────────────────────────────────────────────────── */
export interface Stats {
  total_queries: number
  total_documents: number
  pending_reviews: number
  avg_confidence_pct: number
}

interface DocSummary {
  filename: string
  doc_type: string
  summary: string
}

interface TrendPoint { date: string; queries: number }

export interface Insights {
  attention_items: AttentionItem[]
  suggested_queries: string[]
  doc_summaries: DocSummary[]
  query_trend: TrendPoint[]
  confidence_distribution: { high: number; medium: number; low: number }
  has_insights: boolean
}

/** Progress of a background re-analysis (GET /dashboard/insights/refresh). */
export interface RefreshProgress {
  state: 'idle' | 'running' | 'done' | 'interrupted'
  total: number
  done: number
  failed: number
}

/* ── Helpers ────────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}

function docTypeLabel(t: string) {
  return { ILI_REPORT: 'ILI report', SCADA: 'SCADA export', IMP_SCHEDULE: 'IMP schedule', PHMSA: 'PHMSA incident data', OTHER: 'Document' }[t] ?? t
}

function formatTrendDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Section({ title, note, action, children, style }: {
  title: string
  note?: string
  action?: React.ReactNode
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <section style={style}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650, color: INK, letterSpacing: '-0.01em' }}>{title}</h2>
          {note && <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{note}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, padding: '18px 0', fontSize: 13.5, color: MUTED, lineHeight: 1.55 }}>{children}</p>
}

/* ── View ───────────────────────────────────────────────────────── */
export interface DashboardViewProps {
  role?: string
  stats: Stats | null
  statsError: string | null
  insights: Insights | null
  insightsError: string | null
  insightsLoading: boolean
  docPage: DocumentPage | null
  docsLoading: boolean
  refresh: RefreshProgress | null
  starting: boolean
  onRefresh: () => void
}

/** Everything below the top navigation: header band, findings, activity, knowledge base, suggestions. */
export function DashboardView({
  role, stats, statsError, insights, insightsError, insightsLoading, docPage, docsLoading, refresh, starting, onRefresh,
}: DashboardViewProps) {
  const refreshing = starting || refresh?.state === 'running'
  const attentionItems = insights?.attention_items ?? []
  const suggestedQueries = insights?.suggested_queries ?? []
  const trend = insights?.query_trend ?? []
  const conf = insights?.confidence_distribution ?? { high: 0, medium: 0, low: 0 }
  const confTotal = conf.high + conf.medium + conf.low
  const docs: DocumentItem[] = docPage?.items ?? []
  const indexedCount = docPage?.summary.by_status.COMPLETED ?? 0
  const failedCount = docPage?.summary.by_status.FAILED ?? 0
  const totalDocs = docPage?.summary.documents ?? 0
  const canRefresh = role === 'ENGINEER' || role === 'ADMIN'

  const pending = stats?.pending_reviews ?? 0
  const avgConf = stats?.avg_confidence_pct ?? 0

  return (
    <>
      <PageBand
        eyebrow="Integrity intelligence"
        title="Dashboard"
        description="What PipelineGPT found in your documents, and how the team is using it."
        stats={stats ? [
          { value: stats.total_documents.toLocaleString(), label: 'documents indexed' },
          { value: stats.total_queries.toLocaleString(), label: 'questions answered' },
          { value: pending, label: 'awaiting review', tone: pending > 0 ? '#FEC84B' : undefined, href: '/review' },
          { value: `${avgConf}%`, label: 'average confidence' },
        ] : []}
        actions={canRefresh ? (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title={refresh?.state === 'running' ? 'Re-analysis is running in the background; you can leave this page' : 'Read every document again and rebuild the findings'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: F, fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 6, padding: '7px 12px', cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.75 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refresh?.state === 'running'
              ? `Analysing ${refresh.done.toLocaleString()} of ${refresh.total.toLocaleString()}`
              : starting ? 'Starting…' : 'Re-analyse'}
          </button>
        ) : undefined}
      />

      <main style={{ flex: 1 }}>
        <div className="dash-wrap" style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 32px 48px' }}>

          {statsError && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 22px', padding: '10px 14px', borderRadius: 8, background: '#FFFAEB', color: '#B54708', fontSize: 13 }}>
              <AlertCircle size={15} /> <span><strong>Live figures unavailable:</strong> {statsError}</span>
            </p>
          )}

          <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 56 }}>

            {/* ── Main column ── */}
            <div style={{ minWidth: 0 }}>
              <Section
                title="Needs attention"
                note="Incidents, alarms and deadlines flagged from your documents, most severe first. Select one to read the full detail."
              >
                {insightsLoading ? (
                  <Quiet>Reading the findings from your documents…</Quiet>
                ) : insightsError ? (
                  <Quiet>{insightsError}</Quiet>
                ) : attentionItems.length === 0 ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '18px 0', borderTop: `1px solid ${LINE}` }}>
                    <CheckCircle2 size={20} color="#067647" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: INK }}>
                        {indexedCount > 0 ? 'Nothing flagged in your documents' : 'No documents indexed yet'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 13.5, color: MUTED }}>
                        {indexedCount > 0
                          ? 'Every document has been read and nothing needs attention.'
                          : <>Upload ILI reports, SCADA exports or PHMSA data on the <Link href="/ingest" style={{ color: BLUE, fontWeight: 600 }}>Documents</Link> page to begin.</>}
                      </p>
                    </div>
                  </div>
                ) : (
                  <AttentionList items={attentionItems} />
                )}
              </Section>

              {/* Activity */}
              <Section title="Activity" note="Questions answered over the last 7 days, and how well their answers were backed by sources." style={{ marginTop: 44 }}>
                <div className="dash-activity" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 36, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 600, color: BODY }}>Questions per day</p>
                    {insightsLoading ? (
                      <Quiet>Loading…</Quiet>
                    ) : (
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                          <CartesianGrid stroke="#EEF1F5" vertical={false} />
                          <XAxis dataKey="date" tickFormatter={formatTrendDate} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} />
                          <Tooltip
                            cursor={{ fill: '#F3F6FA' }}
                            formatter={(v: number) => [`${v}`, 'Questions']}
                            labelFormatter={formatTrendDate}
                            contentStyle={{ fontSize: 12, border: `1px solid ${LINE}`, borderRadius: 6 }}
                          />
                          <Bar dataKey="queries" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={26} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 600, color: BODY }}>Answer confidence</p>
                    {confTotal === 0 ? (
                      <Quiet>No answers yet. Confidence shows here once questions are asked.</Quiet>
                    ) : (
                      <>
                        <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: '#EEF1F5' }} aria-hidden>
                          {[{ n: conf.high, c: '#067647' }, { n: conf.medium, c: '#DC8A0E' }, { n: conf.low, c: '#B42318' }].map((s, i) => (
                            s.n > 0 && <div key={i} style={{ width: `${(s.n / confTotal) * 100}%`, background: s.c }} />
                          ))}
                        </div>
                        <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 8 }}>
                          {[
                            { label: 'High', note: '75% and above', n: conf.high, c: '#067647' },
                            { label: 'Medium', note: '40 to 74%', n: conf.medium, c: '#DC8A0E' },
                            { label: 'Low', note: 'below 40%', n: conf.low, c: '#B42318' },
                          ].map(r => (
                            <li key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: BODY }}>
                              <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: r.c }} />
                              <span style={{ fontWeight: 600, color: INK }}>{r.label}</span>
                              <span style={{ color: MUTED }}>{r.note}</span>
                              <span style={{ marginLeft: 'auto', fontWeight: 600, color: INK }}>{r.n} <span style={{ fontWeight: 400, color: MUTED }}>({Math.round((r.n / confTotal) * 100)}%)</span></span>
                            </li>
                          ))}
                        </ul>
                        <p style={{ margin: '10px 0 0', fontSize: 11.5, color: '#9AA4B2' }}>Share of an answer&apos;s figures backed by a cited source.</p>
                      </>
                    )}
                  </div>
                </div>
              </Section>
            </div>

            {/* ── Side column ── */}
            <aside style={{ minWidth: 0 }}>
              <Section
                title="Knowledge base"
                action={<Link href="/ingest" style={{ fontSize: 13, fontWeight: 600, color: BLUE, textDecoration: 'none', whiteSpace: 'nowrap' }}>Manage</Link>}
              >
                <p style={{ margin: '0 0 14px', fontSize: 13.5, color: MUTED }}>
                  {docsLoading ? 'Loading…' : totalDocs === 0 ? 'No documents yet.' : `${indexedCount.toLocaleString()} of ${totalDocs.toLocaleString()} document${totalDocs === 1 ? '' : 's'} ready to answer from.`}
                  {failedCount > 0 && <span style={{ color: '#B42318' }}> {failedCount.toLocaleString()} failed.</span>}
                </p>

                {(insights?.doc_summaries ?? []).slice(0, 3).map((ds, i) => (
                  <div key={i} style={{ margin: '0 0 16px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: BLUE }}>{docTypeLabel(ds.doc_type)}</p>
                    <p style={{ margin: 0, fontSize: 13.5, color: BODY, lineHeight: 1.6 }}>{noDashes(ds.summary)}</p>
                  </div>
                ))}

                {docs.length > 0 && (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `1px solid ${LINE}` }}>
                    {docs.map(doc => {
                      const ok = doc.status === 'COMPLETED'
                      const failed = doc.status === 'FAILED'
                      return (
                        <li key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${LINE}` }}>
                          <FileText size={15} color={failed ? '#B42318' : ok ? BLUE : '#B54708'} style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span title={doc.filename} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.filename}</span>
                            <span style={{ fontSize: 12, color: MUTED }}>
                              {[doc.chunk_count > 0 && `${doc.chunk_count.toLocaleString()} sections`, doc.ingest_date && timeAgo(doc.ingest_date)].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          {!ok && <span style={{ fontSize: 12, fontWeight: 600, color: failed ? '#B42318' : '#B54708' }}>{failed ? 'Failed' : 'Processing'}</span>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Section>

              {suggestedQueries.length > 0 && (
                <Section title="Questions worth asking" note="Written from what's in your documents." style={{ marginTop: 40 }}>
                  <ol style={{ listStyle: 'none', margin: 0, padding: 0, borderTop: `1px solid ${LINE}` }}>
                    {suggestedQueries.map((q, i) => (
                      <li key={i} style={{ borderBottom: `1px solid ${LINE}` }}>
                        <Link href={`/chat?q=${encodeURIComponent(q)}`} className="dash-q" style={{ display: 'flex', gap: 10, padding: '11px 0', textDecoration: 'none', color: BODY, fontSize: 13.5, lineHeight: 1.5 }}>
                          <span title={noDashes(q)} style={{ flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{noDashes(q)}</span>
                          <ArrowRight size={15} color={BLUE} style={{ flexShrink: 0, marginTop: 3 }} />
                        </Link>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}
            </aside>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-q:hover span:first-child { color: ${INK}; text-decoration: underline; text-decoration-color: #C9D1DB; text-underline-offset: 3px; }
        @media (max-width: 1000px) {
          .dash-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 700px) {
          .dash-wrap { padding: 22px 16px 36px !important; }
          .dash-activity { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </>
  )
}
