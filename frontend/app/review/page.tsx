'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/components/NextStep'
import { ReviewCard } from './components/ReviewCard'
import { useReviewQueue } from '@/hooks/useReviewQueue'

const F = 'Inter, system-ui, sans-serif'

const TABS = [
  { key: 'all',      label: 'All'      },
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

export default function ReviewPage() {
  const { status: sessionStatus } = useSession()
  const [activeTab, setActiveTab] = useState('all')
  const { data: items, isLoading } = useReviewQueue(activeTab)

  const sessionLoading = sessionStatus === 'loading'
  const displayItems = items ?? []

  const filteredItems = activeTab === 'all'
    ? displayItems
    : displayItems.filter(i => i.status === activeTab || i.status?.toUpperCase() === activeTab)

  const pendingCount   = displayItems.filter(i => i.status === 'PENDING').length
  const highRiskCount  = displayItems.filter(i => i.risk_level === 'HIGH' && i.status === 'PENDING').length
  const approvedCount  = displayItems.filter(i => i.status === 'APPROVED').length
  const rejectedCount  = displayItems.filter(i => i.status === 'REJECTED').length

  const tabCounts: Record<string, number> = {
    all:      displayItems.length,
    PENDING:  pendingCount,
    APPROVED: approvedCount,
    REJECTED: rejectedCount,
  }

  const showSpinner = sessionLoading || isLoading

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
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #d4d6d8', padding: '20px 40px 0' }}>
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
              { value: pendingCount,  label: 'Awaiting Sign-Off',   sub: 'Responses needing engineer review',                         urgent: pendingCount > 0,  urgentColor: '#991B1B' },
              { value: highRiskCount, label: 'High Risk Pending',    sub: highRiskCount > 0 ? 'Require immediate sign-off' : 'None open', urgent: highRiskCount > 0, urgentColor: '#991B1B' },
              { value: approvedCount, label: 'Responses Cleared',    sub: 'Approved and ready for delivery',                          urgent: false, urgentColor: '' },
              { value: rejectedCount, label: 'Rejected Responses',   sub: rejectedCount > 0 ? 'Returned for correction' : 'None recorded', urgent: false, urgentColor: '' },
            ].map(m => (
              <div key={m.label} className="metric-strip-cell">
                <div style={{ fontFamily: F, fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: m.urgent ? m.urgentColor : '#232e3e', lineHeight: 1, marginBottom: 6 }}>
                  {showSpinner ? '—' : m.value}
                </div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: m.urgent ? m.urgentColor : '#9CA3AF', fontWeight: m.urgent ? 500 : 400 }}>{m.sub}</div>
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
                    fontFamily: F, padding: '10px 20px', border: 'none',
                    borderBottom: isActive ? '2px solid #006eb5' : '2px solid transparent',
                    background: 'none', color: isActive ? '#006eb5' : '#6B7280',
                    fontSize: 14, fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                    marginBottom: -2, transition: 'all 0.12s',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{ background: isActive ? '#006eb5' : '#d4d6d8', color: isActive ? '#fff' : '#6B7280', fontSize: 11, fontWeight: 700, padding: '1px 6px', lineHeight: '16px' }}>
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
          {showSpinner ? (
            <div style={{ textAlign: 'center', padding: '80px', color: '#8896A8' }}>
              <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #d4d6d8', borderTopColor: '#006eb5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 14 }} />
              <p style={{ fontFamily: F, fontSize: 15 }}>Loading review queue…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', background: '#FFFFFF', border: '1px solid #d4d6d8', borderTop: '4px solid #d4d6d8' }}>
              <CheckCircle size={48} color="#1A7A4A" style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: '#232e3e', marginBottom: 6 }}>
                {activeTab === 'all' ? 'Queue is empty' : 'No items in this filter'}
              </p>
              <p style={{ fontFamily: F, fontSize: 14, color: '#6B7280' }}>
                {activeTab === 'all'
                  ? 'Ask a question in the chat to generate responses for review.'
                  : 'No responses match this status.'}
              </p>
            </div>
          ) : (
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
