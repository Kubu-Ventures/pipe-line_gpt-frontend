'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts'
import { AlertTriangle, Clock, CheckCircle, FileText, Upload, TrendingUp } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/app/home/page'

const F      = 'Inter, system-ui, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/* ── Color semantics legend ─────────────────────────────────────────────── */
const COLOR_LEGEND = [
  { dot: '#991B1B', bg: '#FAE0E0', label: 'High risk · Critical · Immediate action required' },
  { dot: '#D97706', bg: '#FEF3C7', label: 'Medium risk · Warning · Compliance flag' },
  { dot: '#1A7A4A', bg: '#D1FAE5', label: 'Low risk · Approved · Within acceptable limits' },
  { dot: BLUE,     bg: '#dff0ff', label: 'AI activity · Queries · System information' },
]

/* ── PHMSA reference chart data (public record — static) ────────────────── */
const CAUSE_DATA = [
  { cause: 'External Corrosion',        count: 89, pct: 31 },
  { cause: 'Equipment Failure',          count: 69, pct: 24 },
  { cause: 'Incorrect Operation',        count: 52, pct: 18 },
  { cause: 'Natural Force / Geohazard',  count: 38, pct: 13 },
  { cause: 'Excavation Damage',          count: 22, pct: 8  },
  { cause: 'Other / Unknown',            count: 17, pct: 6  },
]

/* ── Sample ILI wall-loss progression (demo data) ───────────────────────── */
const WALL_LOSS_DATA = [
  { year: '2016', 'Segment 4B': 18, 'Platform Delta-18': 12, 'Mill Creek HCA': 22 },
  { year: '2019', 'Segment 4B': 28, 'Platform Delta-18': 17, 'Mill Creek HCA': 24 },
  { year: '2022', 'Segment 4B': 35, 'Platform Delta-18': 22, 'Mill Creek HCA': 25 },
  { year: '2024', 'Segment 4B': 42, 'Platform Delta-18': 30, 'Mill Creek HCA': 26 },
]

/* ── Demo risk register ─────────────────────────────────────────────────── */
const SEGMENTS = [
  { id: 'SEG-4B',        name: 'Segment 4B',             risk: 'HIGH'   as const, wallLoss: 42,   lastILI: 'Mar 2024', daysAgo: 90,  hca: true,  action: 'Immediate FFS assessment — exceeds 40% ASME B31.8S threshold' },
  { id: 'PLT-DELTA-18',  name: 'Platform Delta-18',      risk: 'HIGH'   as const, wallLoss: null, lastILI: 'Nov 2025', daysAgo: 210, hca: false, action: 'Wall thickness below API 1111 minimum — derating or shutdown required' },
  { id: 'HCA-07',        name: 'Mill Creek HCA',         risk: 'MEDIUM' as const, wallLoss: 28,   lastILI: 'Jun 2023', daysAgo: 380, hca: true,  action: 'Close interval survey overdue since 2019' },
  { id: 'HCA-04',        name: 'Riverside HCA Crossing', risk: 'MEDIUM' as const, wallLoss: 21,   lastILI: 'Jan 2024', daysAgo: 170, hca: true,  action: 'Emergency response plan update overdue (last: 2021)' },
  { id: 'SEG-12A',       name: 'Segment 12A',            risk: 'LOW'    as const, wallLoss: 14,   lastILI: 'Aug 2025', daysAgo: 295, hca: false, action: 'Monitor — next scheduled ILI Jan 2029' },
]

const DEADLINES = [
  { item: 'CIS Survey — Mill Creek Crossing',   ref: '49 CFR §192.947',    due: 'Jun 30, 2026', daysLeft: 2,  urgent: true  },
  { item: 'ERP Review — Riverside Crossing',    ref: '49 CFR §192.615',    due: 'Jun 30, 2026', daysLeft: 2,  urgent: true  },
  { item: 'ILI Re-inspection — Segment 4B',     ref: 'ASME B31.8S §6.4',   due: 'Jul 15, 2026', daysLeft: 17, urgent: true  },
  { item: 'IMP Performance Measures Report',    ref: '49 CFR §192.947(e)', due: 'Jul 31, 2026', daysLeft: 33, urgent: false },
  { item: 'Annual CP Survey Submission',        ref: '49 CFR §192.463',    due: 'Sep 15, 2026', daysLeft: 79, urgent: false },
]

const RISK_STYLE = {
  HIGH:   { color: '#991B1B', bg: '#FAE0E0', border: '#E8BCBC', dot: '#991B1B' },
  MEDIUM: { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', dot: '#D97706' },
  LOW:    { color: '#1A7A4A', bg: '#D1FAE5', border: '#6EE7B7', dot: '#1A7A4A' },
}

interface Stats {
  total_queries: number
  total_documents: number
  pending_reviews: number
  total_audit_events: number
  avg_confidence_pct: number
}

function DemoTag({ label = 'Demo data' }: { label?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: '#8896A8', background: '#edeff0', padding: '2px 7px', borderRadius: 2,
    }}>
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

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

  const urgentDeadlines = DEADLINES.filter(d => d.urgent).length

  const METRICS = [
    {
      value: stats ? stats.total_queries.toString() : '—',
      label: 'Queries Answered',
      sub: 'AI responses generated from your documents',
      color: BLUE,
      icon: FileText,
    },
    {
      value: stats ? stats.total_documents.toString() : '—',
      label: 'Documents in Knowledge Base',
      sub: 'ILI reports, PHMSA data, SCADA exports',
      color: '#1A7A4A',
      icon: Upload,
    },
    {
      value: stats ? stats.pending_reviews.toString() : '—',
      label: 'Pending Engineer Reviews',
      sub: 'High-risk responses awaiting sign-off',
      color: stats && stats.pending_reviews > 0 ? '#92400E' : '#1A7A4A',
      icon: Clock,
    },
    {
      value: stats ? `${stats.avg_confidence_pct}%` : '—',
      label: 'Avg AI Confidence',
      sub: 'Across all answered queries',
      color: !stats ? DARK
        : stats.avg_confidence_pct >= 80 ? '#1A7A4A'
        : stats.avg_confidence_pct >= 60 ? '#92400E'
        : '#991B1B',
      icon: TrendingUp,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="dashboard" />
      <PageHero
        step="Step 4 of 5 · Analytics"
        title="Integrity Intelligence Dashboard"
        subtitle="Live system metrics, segment risk register, corrosion progression, and compliance deadlines — in one view."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* ── Color legend ── */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 20px',
            background: '#fff', border: '1px solid #d4d6d8', borderRadius: 4,
            padding: '10px 18px', marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>
              Colour key
            </span>
            {COLOR_LEGEND.map(({ dot, bg, label }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>

          {/* ── Backend error notice ── */}
          {statsError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#FEF3C7', border: '1px solid #FDE68A', borderLeft: '3px solid #D97706',
              borderRadius: 4, padding: '10px 16px', marginBottom: 8, fontSize: 13, color: '#92400E',
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span><strong>Live metrics unavailable:</strong> {statsError}</span>
            </div>
          )}

          {/* ── Urgent notice ── */}
          {urgentDeadlines > 0 && (
            <div className="rosen-card" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FDF4F4', border: '1px solid #E8BCBC',
              borderRadius: 4, padding: '10px 18px', marginBottom: 8,
            }}>
              <AlertTriangle size={15} color="#991B1B" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                {urgentDeadlines} compliance deadlines expire within 18 days — Jun 30 and Jul 15.
              </span>
              <a href="#deadlines" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#991B1B', textDecoration: 'underline' }}>
                View deadlines ↓
              </a>
            </div>
          )}

          {/* ── Live metric strip ── */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Live system metrics
              </span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stats ? '#1A7A4A' : '#D97706', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: stats ? '#1A7A4A' : '#92400E' }}>
                {stats ? 'Connected to database' : 'Loading…'}
              </span>
            </div>
          </div>
          <div className="metric-strip" style={{
            background: '#FFFFFF', border: '1px solid #d4d6d8',
            borderRadius: 4, marginBottom: 24, overflow: 'hidden',
          }}>
            {METRICS.map((m) => (
              <div key={m.label} className="metric-strip-cell">
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: m.color, lineHeight: 1, marginBottom: 6 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Charts row ── */}
          <div className="grid-2col" style={{ marginBottom: 24 }}>

            {/* PHMSA reference chart */}
            <div className="rosen-card chart-panel" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>
                    Incident Root Causes — Hazardous Liquid (TX 2015–2023)
                  </h3>
                  <DemoTag label="PHMSA public data" />
                </div>
                <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>
                  Reportable incidents by primary cause · 287 total events
                </p>
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

            {/* Wall loss chart */}
            <div className="rosen-card chart-panel" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>
                    Wall Loss Progression — Max Corrosion Depth (%)
                  </h3>
                  <DemoTag label="Sample ILI data" />
                </div>
                <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>
                  Per ILI run · Dashed line = ASME B31.8S 40% immediate-action threshold
                </p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={WALL_LOSS_DATA} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d6d8" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#8896A8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8896A8' }} axisLine={false} tickLine={false} domain={[0, 55]} unit="%" />
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v}% wall loss`, name]}
                    contentStyle={{ fontSize: 12, border: '1px solid #d4d6d8', borderRadius: 4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={40} stroke="#991B1B" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: 'Action threshold 40%', position: 'insideTopRight', fontSize: 10, fill: '#991B1B' }} />
                  {/* Red = HIGH risk segments above threshold */}
                  <Line type="monotone" dataKey="Segment 4B"        stroke="#991B1B" strokeWidth={2.5} dot={{ r: 4, fill: '#991B1B' }} />
                  {/* Orange = MEDIUM/elevated segments */}
                  <Line type="monotone" dataKey="Platform Delta-18"  stroke="#D97706" strokeWidth={2}   dot={{ r: 3, fill: '#D97706' }} />
                  {/* Blue = segments within safe range */}
                  <Line type="monotone" dataKey="Mill Creek HCA"     stroke={BLUE}    strokeWidth={2}   dot={{ r: 3, fill: BLUE }} />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>Source: ILI inspection reports ingested into PipelineGPT</p>
            </div>
          </div>

          {/* ── Bottom row ── */}
          <div className="grid-3-2">

            {/* Segment risk register */}
            <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #d4d6d8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>Segment Risk Register</h3>
                    <DemoTag label="Sample pipeline data" />
                  </div>
                  <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>Ranked by risk level — ask PipelineGPT for any segment</p>
                </div>
                <Link href="/chat" style={{ fontSize: 12, fontWeight: 600, color: BLUE, textDecoration: 'none' }}>
                  Query AI →
                </Link>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F9FB' }}>
                    {[
                      { label: 'Segment', hide: false }, { label: 'Risk', hide: false },
                      { label: 'Max Wall Loss', hide: true }, { label: 'Last ILI', hide: true },
                      { label: 'Required Action', hide: false },
                    ].map(({ label, hide }) => (
                      <th key={label} className={hide ? 'col-hide-mobile' : ''} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #d4d6d8' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEGMENTS.map((s, i) => {
                    const rs = RISK_STYLE[s.risk]
                    return (
                      <tr key={s.id} style={{ borderBottom: i < SEGMENTS.length - 1 ? '1px solid #edeff0' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{s.id}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`, padding: '2px 8px', borderRadius: 3 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: rs.dot, display: 'inline-block' }} />
                            {s.risk}
                          </span>
                        </td>
                        <td className="col-hide-mobile" style={{ padding: '12px 16px', fontSize: 13, fontWeight: s.wallLoss && s.wallLoss >= 40 ? 700 : 400, color: s.wallLoss && s.wallLoss >= 40 ? '#991B1B' : '#374151' }}>
                          {s.wallLoss != null ? `${s.wallLoss}%` : '< min. wall'}
                        </td>
                        <td className="col-hide-mobile" style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, color: '#374151' }}>{s.lastILI}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{s.daysAgo} days ago</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: s.risk === 'HIGH' ? '#991B1B' : s.risk === 'MEDIUM' ? '#92400E' : '#6B7280', maxWidth: 220 }}>
                          {s.action}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Compliance deadlines */}
            <div id="deadlines" className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #d4d6d8', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #d4d6d8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DARK, margin: 0 }}>Compliance Deadlines</h3>
                  <DemoTag label="Sample IMP schedule" />
                </div>
                <p style={{ fontSize: 12, color: '#8896A8', margin: 0 }}>PHMSA / ASME regulatory obligations</p>
              </div>

              <div style={{ padding: '8px 0' }}>
                {DEADLINES.map((d, i) => (
                  <div key={i} style={{
                    padding: '14px 20px',
                    borderBottom: i < DEADLINES.length - 1 ? '1px solid #edeff0' : 'none',
                    /* Red = overdue/critical, Orange = warning within 20d, Green = on track */
                    borderLeft: d.daysLeft <= 3 ? '3px solid #991B1B' : d.daysLeft <= 20 ? '3px solid #D97706' : '3px solid #d4d6d8',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: DARK, lineHeight: 1.4 }}>{d.item}</span>
                      <span style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 700,
                        color: d.daysLeft <= 3 ? '#991B1B' : d.daysLeft <= 20 ? '#92400E' : '#1A7A4A',
                        background: d.daysLeft <= 3 ? '#FAE0E0' : d.daysLeft <= 20 ? '#FEF3C7' : '#D1FAE5',
                        padding: '2px 8px', borderRadius: 3,
                      }}>
                        {d.daysLeft <= 0 ? 'OVERDUE' : `${d.daysLeft}d`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{d.due}</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: BLUE, background: '#dff0ff', padding: '0 5px', borderRadius: 2 }}>{d.ref}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid #d4d6d8', background: '#F8F9FB' }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                  Ask PipelineGPT: <em>"What are my upcoming PHMSA compliance obligations?"</em>
                </p>
              </div>
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
    </div>
  )
}
