'use client'

import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine,
} from 'recharts'
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/app/page'

const F = 'Inter, system-ui, sans-serif'

/* ── Mock data — all grounded in realistic pipeline integrity scenarios ── */

const CAUSE_DATA = [
  { cause: 'External Corrosion',        count: 89, pct: 31 },
  { cause: 'Equipment Failure',          count: 69, pct: 24 },
  { cause: 'Incorrect Operation',        count: 52, pct: 18 },
  { cause: 'Natural Force / Geohazard',  count: 38, pct: 13 },
  { cause: 'Excavation Damage',          count: 22, pct: 8  },
  { cause: 'Other / Unknown',            count: 17, pct: 6  },
]

/* Wall loss % per segment across successive ILI runs */
const WALL_LOSS_DATA = [
  { year: '2016', 'Segment 4B': 18, 'Platform Delta-18': 12, 'Mill Creek HCA': 22 },
  { year: '2019', 'Segment 4B': 28, 'Platform Delta-18': 17, 'Mill Creek HCA': 24 },
  { year: '2022', 'Segment 4B': 35, 'Platform Delta-18': 22, 'Mill Creek HCA': 25 },
  { year: '2024', 'Segment 4B': 42, 'Platform Delta-18': 30, 'Mill Creek HCA': 26 },
]

const SEGMENTS = [
  {
    id: 'SEG-4B', name: 'Segment 4B', risk: 'HIGH' as const,
    wallLoss: 42, lastILI: 'Mar 2024', daysAgo: 90, hca: true,
    action: 'Immediate FFS assessment — exceeds 40% ASME B31.8S threshold',
  },
  {
    id: 'PLT-DELTA-18', name: 'Platform Delta-18', risk: 'HIGH' as const,
    wallLoss: null, lastILI: 'Nov 2025', daysAgo: 210, hca: false,
    action: 'Wall thickness below API 1111 minimum — derating or shutdown required',
  },
  {
    id: 'HCA-07', name: 'Mill Creek HCA', risk: 'MEDIUM' as const,
    wallLoss: 28, lastILI: 'Jun 2023', daysAgo: 380, hca: true,
    action: 'Close interval survey overdue since 2019',
  },
  {
    id: 'HCA-04', name: 'Riverside HCA Crossing', risk: 'MEDIUM' as const,
    wallLoss: 21, lastILI: 'Jan 2024', daysAgo: 170, hca: true,
    action: 'Emergency response plan update overdue (last: 2021)',
  },
  {
    id: 'SEG-12A', name: 'Segment 12A', risk: 'LOW' as const,
    wallLoss: 14, lastILI: 'Aug 2025', daysAgo: 295, hca: false,
    action: 'Monitor — next scheduled ILI Jan 2029',
  },
]

const DEADLINES = [
  { item: 'CIS Survey — Mill Creek Crossing',   ref: '49 CFR §192.947',    due: 'Jun 30, 2026', daysLeft: 3,  urgent: true },
  { item: 'ERP Review — Riverside Crossing',    ref: '49 CFR §192.615',    due: 'Jun 30, 2026', daysLeft: 3,  urgent: true },
  { item: 'ILI Re-inspection — Segment 4B',     ref: 'ASME B31.8S §6.4',   due: 'Jul 15, 2026', daysLeft: 18, urgent: true },
  { item: 'IMP Performance Measures Report',    ref: '49 CFR §192.947(e)', due: 'Jul 31, 2026', daysLeft: 34, urgent: false },
  { item: 'Annual CP Survey Submission',        ref: '49 CFR §192.463',    due: 'Sep 15, 2026', daysLeft: 80, urgent: false },
]

const RISK_STYLE = {
  HIGH:   { color: '#991B1B', bg: '#FAE0E0', border: '#E8BCBC', dot: '#991B1B' },
  MEDIUM: { color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', dot: '#D97706' },
  LOW:    { color: '#1A7A4A', bg: '#D1FAE5', border: '#6EE7B7', dot: '#1A7A4A' },
}

const METRICS = [
  {
    value: '2',
    label: 'Segments at High Risk',
    sub: 'Require immediate engineer action',
    color: '#991B1B',
    icon: AlertTriangle,
  },
  {
    value: '7',
    label: 'Anomalies — Immediate Action',
    sub: 'Wall loss > 40% or below min. thickness',
    color: '#B45309',
    icon: AlertTriangle,
  },
  {
    value: '4.2 mi',
    label: 'HCA Miles — Assessment Overdue',
    sub: 'Per 49 CFR §192.947 interval',
    color: '#B45309',
    icon: Clock,
  },
  {
    value: '87.4%',
    label: 'Avg. AI Confidence',
    sub: 'Across all approved responses',
    color: '#1A7A4A',
    icon: CheckCircle,
  },
]

export default function DashboardPage() {
  const highCount = SEGMENTS.filter(s => s.risk === 'HIGH').length
  const urgentDeadlines = DEADLINES.filter(d => d.urgent).length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F4F7', fontFamily: F }}>
      <TopNav activeTab="dashboard" />
      <PageHero
        step="Step 4 of 5 · Analytics"
        title="Integrity Intelligence Dashboard"
        subtitle="Segment risk register, anomaly status, corrosion progression, and compliance deadlines — in one view."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1280, margin: '0 auto' }}>

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

          {/* ── Metric strip ── */}
          <div className="metric-strip" style={{
            background: '#FFFFFF', border: '1px solid #E4E8EF',
            borderRadius: 4, marginBottom: 24, overflow: 'hidden',
          }}>
            {METRICS.map((m, i) => (
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

            {/* Incident root cause — PHMSA hazardous liquid TX 2015–2023 */}
            <div className="rosen-card chart-panel" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2A', marginBottom: 3 }}>
                  Incident Root Causes — Hazardous Liquid (TX 2015–2023)
                </h3>
                <p style={{ fontSize: 12, color: '#8896A8' }}>
                  PHMSA reportable incidents by primary cause · 287 total events
                </p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={CAUSE_DATA}
                  layout="vertical"
                  margin={{ top: 0, right: 48, bottom: 0, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EF" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#8896A8' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis
                    type="category" dataKey="cause"
                    tick={{ fontSize: 11, fill: '#4A5568' }}
                    axisLine={false} tickLine={false} width={158}
                  />
                  <Tooltip
                    formatter={(v: number, _: string, entry: any) => [`${entry.payload.count} incidents (${v}%)`, 'Share']}
                    contentStyle={{ fontSize: 12, border: '1px solid #E4E8EF', borderRadius: 4 }}
                  />
                  <Bar dataKey="pct" fill="#005DAA" radius={[0, 3, 3, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
                Source: PHMSA Hazardous Liquid Incident Files (phmsa.dot.gov)
              </p>
            </div>

            {/* Wall loss progression across ILI runs */}
            <div className="rosen-card chart-panel" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6, padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2A', marginBottom: 3 }}>
                  Wall Loss Progression — Max Corrosion Depth (%)
                </h3>
                <p style={{ fontSize: 12, color: '#8896A8' }}>
                  Per ILI run · Dashed line = ASME B31.8S 40% immediate-action threshold
                </p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={WALL_LOSS_DATA} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4E8EF" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#8896A8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#8896A8' }} axisLine={false} tickLine={false} domain={[0, 55]} unit="%" />
                  <Tooltip
                    formatter={(v: number, name: string) => [`${v}% wall loss`, name]}
                    contentStyle={{ fontSize: 12, border: '1px solid #E4E8EF', borderRadius: 4 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine y={40} stroke="#991B1B" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: 'Action threshold 40%', position: 'insideTopRight', fontSize: 10, fill: '#991B1B' }} />
                  <Line type="monotone" dataKey="Segment 4B"       stroke="#991B1B" strokeWidth={2.5} dot={{ r: 4, fill: '#991B1B' }} />
                  <Line type="monotone" dataKey="Platform Delta-18" stroke="#D97706" strokeWidth={2} dot={{ r: 3, fill: '#D97706' }} />
                  <Line type="monotone" dataKey="Mill Creek HCA"   stroke="#005DAA" strokeWidth={2} dot={{ r: 3, fill: '#005DAA' }} />
                </LineChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 12 }}>
                Source: ILI inspection reports ingested into PipelineGPT
              </p>
            </div>
          </div>

          {/* ── Bottom row: Segment risk register + Compliance deadlines ── */}
          <div className="grid-3-2">

            {/* Segment risk register */}
            <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E4E8EF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2A', marginBottom: 2 }}>Segment Risk Register</h3>
                  <p style={{ fontSize: 12, color: '#8896A8' }}>Ranked by current risk level — ask PipelineGPT for any segment</p>
                </div>
                <Link href="/chat" style={{ fontSize: 12, fontWeight: 600, color: '#005DAA', textDecoration: 'none' }}>
                  Query AI →
                </Link>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F9FB' }}>
                    {[
                      { label: 'Segment',         hide: false },
                      { label: 'Risk',             hide: false },
                      { label: 'Max Wall Loss',    hide: true  },
                      { label: 'Last ILI',         hide: true  },
                      { label: 'Required Action',  hide: false },
                    ].map(({ label, hide }) => (
                      <th key={label} className={hide ? 'col-hide-mobile' : ''} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #E4E8EF' }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SEGMENTS.map((s, i) => {
                    const rs = RISK_STYLE[s.risk]
                    return (
                      <tr key={s.id} style={{ borderBottom: i < SEGMENTS.length - 1 ? '1px solid #F2F4F7' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2A' }}>{s.name}</div>
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

            {/* Compliance deadline tracker */}
            <div id="deadlines" className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #E4E8EF' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2A', marginBottom: 2 }}>Compliance Deadlines</h3>
                <p style={{ fontSize: 12, color: '#8896A8' }}>PHMSA / ASME regulatory obligations</p>
              </div>

              <div style={{ padding: '8px 0' }}>
                {DEADLINES.map((d, i) => (
                  <div key={i} style={{
                    padding: '14px 20px',
                    borderBottom: i < DEADLINES.length - 1 ? '1px solid #F2F4F7' : 'none',
                    borderLeft: d.daysLeft <= 3 ? '3px solid #991B1B' : d.daysLeft <= 20 ? '3px solid #D97706' : '3px solid #E4E8EF',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2A', lineHeight: 1.4 }}>{d.item}</span>
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
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#005DAA', background: '#E8F0F9', padding: '0 5px', borderRadius: 2 }}>{d.ref}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px 20px', borderTop: '1px solid #E4E8EF', background: '#F8F9FB' }}>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>
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
