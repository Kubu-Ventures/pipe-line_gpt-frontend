'use client'

import { useState } from 'react'
import { ClipboardCheck, CheckCircle, AlertCircle } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/app/home/page'
import { ReviewCard } from './components/ReviewCard'
import { useReviewQueue } from '@/hooks/useReviewQueue'

const F = 'Inter, system-ui, sans-serif'

const MOCK_ITEMS = [
  {
    id: '1', response_id: 'r1', query_id: 'q1',
    question_raw: 'Based on recent inspection data for Segment 4B, should we reduce the maximum operating pressure?',
    answer_text: 'Based on the ILI inspection data retrieved for Segment 4B [SRC-001], there are indications of localized external corrosion at three anomaly clusters between station 142+00 and 156+00 [SRC-002]. The maximum depth recorded is 42% wall loss [SRC-001]. Per ASME B31.8S criteria [SRC-003], anomalies exceeding 40% wall loss require immediate evaluation. I recommend reducing the maximum operating pressure by 15% and scheduling an urgent engineering fitness-for-service assessment before the next inspection window.',
    confidence_score: 0.61,
    risk_level: 'HIGH' as const,
    status: 'PENDING',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    user_email: 'operator@rosen-group.com',
    chunk_count: 6,
    citations_json: [
      { source_id: 'SRC-001', document_id: 'd1', filename: 'ILI_Report_Segment4B.pdf', chunk_index: 14, page_ref: 'p. 14', section_label: 'Section 3.2 — Anomaly Assessment', text: 'Three anomaly clusters identified between station 142+00 and 156+00. Maximum external corrosion depth: 42% nominal wall thickness at cluster B2. Cluster dimensions: 120 mm longitudinal × 40 mm circumferential. Remaining wall: 7.0 mm against nominal 11.9 mm.' },
      { source_id: 'SRC-002', document_id: 'd1', filename: 'ILI_Report_Segment4B.pdf', chunk_index: 21, page_ref: 'p. 21', section_label: 'Section 4.1 — Pressure Reduction Criteria', text: 'Per ASME B31.8S-2020 Table 1, anomalies with depth exceeding 40% wall loss and length > 200 mm require immediate pressure reduction to 72% SMYS pending fitness-for-service assessment. Operator must complete FFS evaluation within 60 days.' },
      { source_id: 'SRC-003', document_id: 'd2', filename: 'ASME_B31.8S_Reference.pdf', chunk_index: 7, page_ref: 'p. 34', section_label: 'Table 1 — Response Requirements', text: 'Immediate response criteria: metal loss anomalies ≥ 40% depth, dents with metal loss, and cracks or crack-like anomalies require scheduled remediation or pressure reduction prior to scheduled ILI re-inspection interval.' },
      { source_id: 'SRC-004', document_id: 'd3', filename: 'SCADA_Export_Q1_2024.csv', chunk_index: 3, page_ref: 'Row 1847', section_label: 'Pressure Readings — Segment 4B', text: 'Max operating pressure Segment 4B: 8.27 MPa (1,199 psi). Recorded pressure fluctuations: ±0.3 MPa over 90-day period. No anomalous pressure spikes recorded. Current MAOP certification: 8.96 MPa.' },
    ],
  },
  {
    id: '2', response_id: 'r2', query_id: 'q2',
    question_raw: 'What maintenance actions are recommended for our HCA crossings before the Q3 compliance deadline?',
    answer_text: 'For High Consequence Area crossings scheduled before the Q3 compliance deadline, the following maintenance actions are recommended based on PHMSA 49 CFR Part 192 Subpart O [SRC-001] and your current integrity management records [SRC-002]: 1) Complete the overdue close interval survey on the four HCA crossings flagged in the 2024 CP annual survey [SRC-002]. 2) Update emergency response plans for the Riverside crossing (last updated 2021) [SRC-003]. 3) Submit annual integrity management performance measures by July 31 [SRC-001].',
    confidence_score: 0.72,
    risk_level: 'MEDIUM' as const,
    status: 'PENDING',
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    user_email: 'engineer@rosen-group.com',
    chunk_count: 4,
    citations_json: [
      { source_id: 'SRC-001', document_id: 'd4', filename: 'PHMSA_Gas_Transmission_2024.zip', chunk_index: 88, page_ref: '49 CFR §192.947', section_label: 'Subpart O — Gas Transmission Pipeline Integrity Management', text: 'Operators must complete all scheduled preventive and mitigative (P&M) measures within the time frames specified in their IMP. For HCAs, close interval surveys must be conducted within 5 years. Annual performance measures due by July 31 each year per §192.947(e).' },
      { source_id: 'SRC-002', document_id: 'd5', filename: 'IMP_Records_2024.pdf', chunk_index: 12, page_ref: 'p. 7', section_label: 'CP Survey Status — HCA Crossings', text: 'HCA crossings flagged for overdue close interval survey (CIS): Riverside Rd (CP-HCA-04), Mill Creek Crossing (CP-HCA-07), Industrial Blvd (CP-HCA-11), Hwy 87 Overpass (CP-HCA-14). Last CIS performed: 2019. Scheduled: Q3 2024 (OVERDUE).' },
      { source_id: 'SRC-003', document_id: 'd5', filename: 'IMP_Records_2024.pdf', chunk_index: 19, page_ref: 'p. 12', section_label: 'Emergency Response Plans', text: 'Riverside Crossing ERP last reviewed and approved: March 2021. Update required per 49 CFR §192.615 every three years. Current status: OVERDUE. Contact emergency coordinator J. Martinez to schedule review before June 30.' },
    ],
  },
  {
    id: '3', response_id: 'r3', query_id: 'q3',
    question_raw: 'How many hazardous liquid pipeline incidents occurred in Texas between 2015 and 2023?',
    answer_text: 'According to PHMSA incident data for hazardous liquid pipelines in Texas from 2015 to 2023 [SRC-001], there were 287 reportable incidents. The top three causes were: 1) Corrosion (31% of incidents, 89 events), primarily external corrosion on older carbon steel pipe [SRC-002]; 2) Equipment failure (24%, 69 events), predominantly valve and pump malfunctions; 3) Incorrect operation (18%, 52 events) [SRC-001].',
    confidence_score: 0.94,
    risk_level: 'LOW' as const,
    status: 'APPROVED',
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    user_email: 'operator@rosen-group.com',
    chunk_count: 3,
    citations_json: [
      { source_id: 'SRC-001', document_id: 'd6', filename: 'PHMSA_Hazardous_Liquid_Incidents_2015_2023.zip', chunk_index: 1, page_ref: 'Rows 1–287 (TX filter)', section_label: 'Annual Incident Summary — Texas', text: 'Total reportable incidents, hazardous liquid, Texas, 2015–2023: 287. Breakdown by cause: Corrosion 89 (31%), Equipment failure 69 (24%), Incorrect operation 52 (18%), Natural force 38 (13%), Excavation damage 22 (8%), Other/unknown 17 (6%). Total volume released: 1,842,000 gallons. Fatalities: 3. Injuries: 14.' },
      { source_id: 'SRC-002', document_id: 'd6', filename: 'PHMSA_Hazardous_Liquid_Incidents_2015_2023.zip', chunk_index: 8, page_ref: 'Corrosion subset', section_label: 'Corrosion Incidents — Root Cause Analysis', text: 'Of 89 corrosion-related incidents in Texas 2015–2023: external corrosion accounted for 67 incidents (75%), internal corrosion for 18 (20%), and stress corrosion cracking (SCC) for 4 (5%). Pipe vintage pre-1970 overrepresented at 61% of corrosion incidents.' },
    ],
  },
  {
    id: '4', response_id: 'r4', query_id: 'q4',
    question_raw: 'Is it safe to continue operating the offshore pipeline section near Platform Delta given the latest wall-thickness readings?',
    answer_text: 'The latest ultrasonic wall-thickness readings for the offshore section near Platform Delta show remaining wall thickness of 3.8 mm at the most critical point [SRC-001] (minimum allowable: 4.2 mm per API 1111 [SRC-002]). This is below the minimum required thickness. Continued operation at current pressure creates a risk of failure [SRC-001]. Immediate shutdown and repair or derating is recommended [SRC-002].',
    confidence_score: 0.89,
    risk_level: 'HIGH' as const,
    status: 'PENDING',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    user_email: 'operator2@rosen-group.com',
    chunk_count: 8,
    citations_json: [
      { source_id: 'SRC-001', document_id: 'd7', filename: 'Offshore_UT_Survey_PlatformDelta_2026.pdf', chunk_index: 4, page_ref: 'p. 8', section_label: 'Section 2 — Wall Thickness Measurements', text: 'Critical location: 18" OD carbon steel, KP 14+220. Minimum measured wall thickness: 3.8 mm (nominal: 12.7 mm, corrosion allowance: 1.6 mm). Minimum required per pressure calculation: 4.2 mm. Deficiency: 0.4 mm below minimum. Corrosion rate: 0.9 mm/year (accelerated, seawater exposure).' },
      { source_id: 'SRC-002', document_id: 'd8', filename: 'API_1111_Reference_Offshore.pdf', chunk_index: 11, page_ref: 'p. 41', section_label: '§4.3 — Minimum Wall Thickness Criteria', text: 'When measured wall thickness falls below the calculated minimum required thickness (t_min), the pipeline segment shall be immediately derated to a maximum operating pressure consistent with the actual remaining wall, or taken out of service. Return to service requires fitness-for-service assessment per API 579-1/ASME FFS-1.' },
      { source_id: 'SRC-003', document_id: 'd9', filename: 'GIS_Offshore_RightOfWay.geojson', chunk_index: 0, page_ref: 'Feature ID: PLT-DELTA-18', section_label: 'Pipeline Segment Geometry', text: 'Segment PLT-DELTA-18: offshore subsea pipeline, water depth 42 m, length 2.14 km. Platform Delta tie-in to HP separator. Pipeline contents: crude oil, 42° API. Installed: 1998. Last pigging: 2023-09.' },
    ],
  },
]

const TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

export default function ReviewPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { data: items, isLoading } = useReviewQueue(activeTab)

  const displayItems = items ?? MOCK_ITEMS

  const filteredItems = activeTab === 'all'
    ? displayItems
    : displayItems.filter(i => i.status === activeTab || i.status?.toUpperCase() === activeTab)

  const pendingCount   = displayItems.filter(i => i.status === 'PENDING').length
  const highRiskCount  = displayItems.filter(i => i.risk_level === 'HIGH' && i.status === 'PENDING').length
  const approvedCount  = displayItems.filter(i => i.status === 'APPROVED').length
  const rejectedCount  = displayItems.filter(i => i.status === 'REJECTED').length

  // Count per tab
  const tabCounts: Record<string, number> = {
    all:      displayItems.length,
    PENDING:  pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="review" />

      <PageHero
        step="Step 3 of 5 · AI Review"
        title="Engineer Review Queue"
        subtitle="No AI recommendation ever reaches an operator without engineer sign-off. Approve, edit, or reject each response below."
        compact
      />

      {/* ── Controls strip ── */}
      <div style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #d4d6d8',
        padding: '20px 40px 0',
        /* padding overridden at ≤768px by .page-content */
      }}>
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 0, paddingBottom: 0 }}>

          {/* Alert badge */}
          {pendingCount > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#FDF4F4', border: '1px solid #E8BCBC',
                borderLeft: '4px solid #991B1B', padding: '8px 16px',
              }}>
                <AlertCircle size={15} color="#991B1B" />
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                  {pendingCount} response{pendingCount !== 1 ? 's' : ''} awaiting review
                  {highRiskCount > 0 && ` · ${highRiskCount} high risk`}
                </span>
              </div>
            </div>
          )}

          {/* ── Metric strip ── */}
          <div className="metric-strip" style={{
            background: '#FFFFFF', border: '1px solid #d4d6d8',
            borderTop: '4px solid #006eb5', marginBottom: 24, overflow: 'hidden',
          }}>
            {[
              {
                value: pendingCount,
                label: 'Awaiting Sign-Off',
                sub: 'Responses needing engineer review',
                urgent: pendingCount > 0,
                urgentColor: '#991B1B',
              },
              {
                value: highRiskCount,
                label: 'High Risk Pending',
                sub: highRiskCount > 0 ? 'Require immediate engineer sign-off' : 'No high-risk items open',
                urgent: highRiskCount > 0,
                urgentColor: '#991B1B',
              },
              {
                value: approvedCount,
                label: 'Responses Cleared',
                sub: 'Approved and ready for delivery',
                urgent: false,
                urgentColor: '',
              },
              {
                value: rejectedCount,
                label: 'Rejected Responses',
                sub: rejectedCount > 0 ? 'Responses returned for correction' : 'No rejections recorded',
                urgent: false,
                urgentColor: '',
              },
            ].map((m, i, arr) => (
              <div key={m.label} className="metric-strip-cell">
                <div style={{
                  fontFamily: F,
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  color: m.urgent ? m.urgentColor : '#232e3e',
                  lineHeight: 1,
                  marginBottom: 6,
                }}>
                  {m.value}
                </div>
                <div style={{
                  fontFamily: F,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 3,
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontFamily: F,
                  fontSize: 12,
                  color: m.urgent ? m.urgentColor : '#9CA3AF',
                  fontWeight: m.urgent ? 500 : 400,
                }}>
                  {m.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #d4d6d8', marginBottom: -2 }}>
            {TABS.map(({ key, label }) => {
              const isActive = activeTab === key
              const count = tabCounts[key] ?? 0
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    fontFamily: F,
                    padding: '10px 20px',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #006eb5' : '2px solid transparent',
                    background: 'none',
                    color: isActive ? '#006eb5' : '#6B7280',
                    fontSize: 14, fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                    marginBottom: -2,
                    transition: 'all 0.12s',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{
                      background: isActive ? '#006eb5' : '#d4d6d8',
                      color: isActive ? '#fff' : '#6B7280',
                      fontSize: 11, fontWeight: 700,
                      padding: '1px 6px',
                      lineHeight: '16px',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#8896A8' }}>
              <div style={{
                display: 'inline-block', width: 28, height: 28,
                border: '3px solid #d4d6d8', borderTopColor: '#006eb5',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                marginBottom: 14,
              }} />
              <p style={{ fontFamily: F, fontSize: 15 }}>Loading review queue…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '80px',
              background: '#FFFFFF', border: '1px solid #d4d6d8',
              borderTop: '4px solid #d4d6d8',
            }}>
              <CheckCircle size={48} color="#1A7A4A" style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: '#232e3e', marginBottom: 6 }}>
                Queue is clear
              </p>
              <p style={{ fontFamily: F, fontSize: 14, color: '#6B7280' }}>
                No items match this filter. All responses have been reviewed.
              </p>
            </div>
          ) : (
            /* HIGH RISK items first */
            [...filteredItems]
              .sort((a, b) => {
                const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
                const statusOrder = { PENDING: 0, APPROVED: 1, REJECTED: 2 }
                const rA = order[a.risk_level as keyof typeof order] ?? 2
                const rB = order[b.risk_level as keyof typeof order] ?? 2
                const sA = statusOrder[a.status as keyof typeof statusOrder] ?? 1
                const sB = statusOrder[b.status as keyof typeof statusOrder] ?? 1
                return sA !== sB ? sA - sB : rA - rB
              })
              .map(item => <ReviewCard key={item.id} item={item} />)
          )}
        </div>
      </main>

      <NextStep
        href="/dashboard"
        label="View Analytics"
        description="After reviewing AI recommendations, track incident trends and system performance on the dashboard."
      />
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
