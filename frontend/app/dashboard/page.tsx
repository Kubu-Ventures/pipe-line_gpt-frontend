'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  AlertTriangle, Clock, CheckCircle, FileText, Upload, TrendingUp,
  Database, BarChart2, File, MapPin, MessageSquare,
} from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/components/NextStep'
import { getIngestHistory } from '@/lib/api'

const F    = 'Inter, system-ui, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const COLOR_LEGEND = [
  { dot: '#991B1B', label: 'High risk · Critical · Immediate action required' },
  { dot: '#D97706', label: 'Medium risk · Warning · Compliance flag' },
  { dot: '#1A7A4A', label: 'Low risk · Approved · Within acceptable limits' },
  { dot: BLUE,     label: 'AI activity · Queries · System information' },
]

/* PHMSA public reference data — static by definition */
const CAUSE_DATA = [
  { cause: 'External Corrosion',        count: 89, pct: 31 },
  { cause: 'Equipment Failure',          count: 69, pct: 24 },
  { cause: 'Incorrect Operation',        count: 52, pct: 18 },
  { cause: 'Natural Force / Geohazard',  count: 38, pct: 13 },
  { cause: 'Excavation Damage',          count: 22, pct: 8  },
  { cause: 'Other / Unknown',            count: 17, pct: 6  },
]

interface Stats {
  total_queries: number
  total_documents: number
  pending_reviews: number
  total_audit_events: number
  avg_confidence_pct: number
}

interface DocRecord {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  chunk_count: number
  created_at: string
  error_message?: string | null
}

function docIcon(filename: string) {
  const f = filename.toLowerCase()
  if (f.includes('phmsa') || f.includes('incident')) return Database
  if (f.includes('scada') || f.endsWith('.csv')) return BarChart2
  if (f.includes('gis') || f.endsWith('.geojson')) return MapPin
  return FileText
}

function docColor(filename: string) {
  const f = filename.toLowerCase()
  if (f.includes('phmsa') || f.includes('incident')) return BLUE
  if (f.includes('scada') || f.endsWith('.csv')) return '#065F46'
  if (f.includes('ili') || f.endsWith('.pdf')) return '#B45309'
  if (f.includes('integrity') || f.includes('imp')) return '#5B21B6'
  return '#55606e'
}

function docLabel(filename: string) {
  const f = filename.toLowerCase()
  if (f.includes('phmsa')) return 'PHMSA Dataset'
  if (f.includes('scada')) return 'SCADA Export'
  if (f.includes('ili')) return 'ILI Report'
  if (f.includes('imp') || f.includes('integrity')) return 'IMP Record'
  if (f.endsWith('.pdf')) return 'PDF Report'
  if (f.endsWith('.csv')) return 'CSV Data'
  return 'Document'
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

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocRecord[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  useEffect(() => {
    if (!session?.accessToken) return
    setStatsError(null)
    fetch(`${API_URL}/health/stats`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(async r => {
        if (r.status === 401) { setStatsError('Session expired — please sign out and back in.'); return null }
        if (!r.ok) { setStatsError(`Backend error ${r.status}`); return null }
        return r.json()
      })
      .then(d => { if (d) setStats(d) })
      .catch(() => setStatsError('Cannot reach backend — confirm it is running on port 8000.'))
  }, [session?.accessToken])

  useEffect(() => {
    if (!session?.accessToken) return
    setDocsLoading(true)
    getIngestHistory((session as any).accessToken)
      .then(data => setDocs(data ?? []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }, [session?.accessToken])

  const METRICS = [
    { value: stats ? stats.total_queries.toString() : '—',       label: 'Queries Answered',           sub: 'AI responses from your documents',          color: BLUE,    icon: MessageSquare },
    { value: stats ? stats.total_documents.toString() : '—',     label: 'Documents Indexed',           sub: 'ILI reports, PHMSA data, SCADA exports',   color: '#1A7A4A', icon: Upload },
    { value: stats ? stats.pending_reviews.toString() : '—',     label: 'Pending Engineer Reviews',    sub: 'High-risk responses awaiting sign-off',     color: stats && stats.pending_reviews > 0 ? '#92400E' : '#1A7A4A', icon: Clock },
    {
      value: stats ? `${stats.avg_confidence_pct}%` : '—',
      label: 'Avg AI Confidence', sub: 'Across all answered queries',
      color: !stats ? DARK : stats.avg_confidence_pct >= 80 ? '#1A7A4A' : stats.avg_confidence_pct >= 60 ? '#92400E' : '#991B1B',
      icon: TrendingUp,
    },
  ]

  const doneDocs  = docs.filter(d => d.status === 'DONE')
  const failedDocs = docs.filter(d => d.status === 'FAILED')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="dashboard" />
      <PageHero
        step="Step 4 of 5 · Analytics"
        title="Integrity Intelligence Dashboard"
        subtitle="Live system metrics, ingested knowledge base, and PHMSA reference data — in one view."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Color legend */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 20px', background: '#fff', border: '1px solid #d4d6d8', borderRadius: 4, padding: '10px 18px', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>Colour key</span>
            {COLOR_LEGEND.map(({ dot, label }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>

          {/* Backend error */}
          {statsError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FEF3C7', border: '1px solid #FDE68A', borderLeft: '3px solid #D97706', borderRadius: 4, padding: '10px 16px', marginBottom: 8, fontSize: 13, color: '#92400E' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Live metrics unavailable:</strong> {statsError}</span>
            </div>
          )}

          {/* Metric strip */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live system metrics</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stats ? '#1A7A4A' : '#D97706', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: stats ? '#1A7A4A' : '#92400E' }}>{stats ? 'Connected to database' : sessionStatus === 'loading' ? 'Loading session…' : 'Loading…'}</span>
            </div>
          </div>
          <div className="metric-strip" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 4, marginBottom: 24, overflow: 'hidden' }}>
            {METRICS.map(m => (
              <div key={m.label} className="metric-strip-cell">
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: m.color, lineHeight: 1, marginBottom: 6 }}>{m.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts + knowledge base row */}
          <div className="grid-2col" style={{ marginBottom: 24 }}>

            {/* PHMSA reference chart — public record data, static */}
            <div className="rosen-card chart-panel" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>Incident Root Causes — Hazardous Liquid (TX 2015–2023)</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: BLUE, background: '#dff0ff', padding: '2px 7px', borderRadius: 2 }}>PHMSA public data</span>
                </div>
                <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>Reportable incidents by primary cause · 287 total events</p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={CAUSE_DATA} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d6d8" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8896A8' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="cause" tick={{ fontSize: 11, fill: '#4A5568' }} axisLine={false} tickLine={false} width={158} />
                  <Tooltip
                    formatter={(v: number, _: string, entry: any) => [`${entry.payload.count} incidents (${v}%)`, 'Share']}
                    contentStyle={{ fontSize: 12, border: '1px solid #d4d6d8', borderRadius: 4 }}
                  />
                  <Bar dataKey="pct" fill={BLUE} radius={[0, 3, 3, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>Source: PHMSA Hazardous Liquid Incident Files (phmsa.dot.gov)</p>
            </div>

            {/* Knowledge base — real ingested documents */}
            <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: '0 0 2px' }}>Indexed Knowledge Base</h3>
                  <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>
                    {docsLoading ? 'Loading documents…' : doneDocs.length > 0 ? `${doneDocs.length} document${doneDocs.length !== 1 ? 's' : ''} ready for AI queries` : 'No documents indexed yet'}
                  </p>
                </div>
                <Link href="/ingest" style={{ fontSize: 12, fontWeight: 600, color: BLUE, textDecoration: 'none' }}>
                  Manage →
                </Link>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                {docsLoading ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#8896A8' }}>
                    <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #d4d6d8', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 10 }} />
                    <p style={{ fontSize: 13 }}>Loading documents…</p>
                  </div>
                ) : docs.length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#8896A8' }}>
                    <Upload size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 6 }}>No documents yet</p>
                    <p style={{ fontSize: 12, marginBottom: 14 }}>Upload ILI reports, SCADA exports, or load the demo dataset to get started.</p>
                    <Link href="/ingest" style={{ fontSize: 12, fontWeight: 600, color: BLUE }}>Go to Ingest →</Link>
                  </div>
                ) : (
                  docs.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((doc, i) => {
                    const Icon = docIcon(doc.filename)
                    const color = docColor(doc.filename)
                    const label = docLabel(doc.filename)
                    const isOk = doc.status === 'DONE'
                    const isFail = doc.status === 'FAILED'
                    return (
                      <div key={doc.id} style={{ padding: '12px 20px', borderBottom: i < docs.length - 1 ? '1px solid #edeff0' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ width: 32, height: 32, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={14} color={color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                            {isOk && <span style={{ fontSize: 10, fontWeight: 700, color: '#1A7A4A', background: '#D1FAE5', padding: '1px 5px', borderRadius: 2 }}>INDEXED</span>}
                            {isFail && <span style={{ fontSize: 10, fontWeight: 700, color: '#991B1B', background: '#FAE0E0', padding: '1px 5px', borderRadius: 2 }}>FAILED</span>}
                            {!isOk && !isFail && <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '1px 5px', borderRadius: 2 }}>{doc.status}</span>}
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0 0 2px' }}>{doc.filename}</p>
                          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9CA3AF' }}>
                            {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
                            <span>{timeAgo(doc.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {failedDocs.length > 0 && (
                <div style={{ padding: '10px 20px', borderTop: '1px solid #d4d6d8', background: '#FDF4F4', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: '#991B1B', fontWeight: 600 }}>
                    {failedDocs.length} document{failedDocs.length !== 1 ? 's' : ''} failed to index
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI insights prompt */}
          <div style={{ background: DARK, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ width: 32, height: 2, background: '#ffeb00', marginBottom: 10 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Query Your Pipeline Data</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', margin: 0 }}>
                Ask about wall loss, compliance obligations, anomaly clusters, or segment risk — grounded in your indexed documents.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
              {[
                'What are the highest wall-loss segments?',
                'Summarize upcoming compliance deadlines',
                'Which segments exceed the ASME 40% threshold?',
              ].map(q => (
                <Link key={q} href={`/chat?q=${encodeURIComponent(q)}`} style={{
                  fontSize: 12, fontWeight: 500, color: '#fff',
                  background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)',
                  padding: '8px 14px', textDecoration: 'none', display: 'inline-block',
                  transition: 'background 0.15s',
                }}>
                  {q}
                </Link>
              ))}
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
