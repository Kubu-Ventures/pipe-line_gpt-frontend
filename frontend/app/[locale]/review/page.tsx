'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/TopNav'
import { useReviewQueue, useSubmitDecision } from '@/hooks/useReviewQueue'
import type { ReviewItem } from '@/lib/api'
import { EmptyQueueArt } from './components/EmptyQueueArt'
import { QueueList } from './components/QueueList'
import { ReviewDetail, type Decision } from './components/ReviewDetail'
import { SourcePanel } from './components/SourcePanel'
import { BLUE, F, INK, LINE, MUTED, SURFACE } from './components/reviewStyle'

const FILTERS = [
  { key: 'PENDING',  label: 'Awaiting review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'all',      label: 'All' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

const RISK_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

/** An edited approval comes back from the API with status EDIT. */
const isApproved = (status: string) => status === 'APPROVED' || status === 'EDIT'

/** Pending first, then by risk, then newest first. */
function byPriority(a: ReviewItem, b: ReviewItem) {
  const pa = a.status === 'PENDING' ? 0 : 1
  const pb = b.status === 'PENDING' ? 0 : 1
  if (pa !== pb) return pa - pb
  const ra = RISK_ORDER[a.risk_level] ?? 2
  const rb = RISK_ORDER[b.risk_level] ?? 2
  if (ra !== rb) return ra - rb
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export default function ReviewPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const role = (session?.user as any)?.role as string | undefined

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!role || role === 'OPERATOR') router.replace('/home')
  }, [role, sessionStatus, router])

  // Fetch everything once, so the counts stay right whichever filter is shown
  const { data, isLoading } = useReviewQueue('all')
  const { mutate, isPending: deciding } = useSubmitDecision()
  const all = useMemo(() => [...(data ?? [])].sort(byPriority), [data])

  const [filter, setFilter] = useState<FilterKey>('PENDING')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [sources, setSources] = useState<{ open: boolean; activeId: string | null }>({ open: false, activeId: null })

  const counts: Record<FilterKey, number> = {
    PENDING: all.filter(i => i.status === 'PENDING').length,
    APPROVED: all.filter(i => isApproved(i.status)).length,
    REJECTED: all.filter(i => i.status === 'REJECTED').length,
    all: all.length,
  }
  const highRisk = all.filter(i => i.status === 'PENDING' && i.risk_level === 'HIGH').length
  const visible = useMemo(
    () => (filter === 'all' ? all : all.filter(i => (filter === 'APPROVED' ? isApproved(i.status) : i.status === filter))),
    [all, filter],
  )
  const selected = visible.find(i => i.id === selectedId) ?? visible[0] ?? null

  // Move through the queue with the arrow keys (or j / k) when not typing
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || sources.open || !visible.length) return
      const step = e.key === 'ArrowDown' || e.key === 'j' ? 1 : e.key === 'ArrowUp' || e.key === 'k' ? -1 : 0
      if (!step) return
      e.preventDefault()
      const i = Math.max(0, visible.findIndex(v => v.id === selected?.id))
      setSelectedId(visible[Math.min(visible.length - 1, Math.max(0, i + step))].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, selected, sources.open])

  function decide(d: Decision) {
    if (!selected) return
    const current = selected.id
    // After a decision, go to the next item still waiting
    const next = visible.find(i => i.id !== current && i.status === 'PENDING')
    mutate({ queryId: selected.query_id, decision: d }, {
      onSuccess: () => {
        setSelectedId(next?.id ?? current)
        if (!next) setMobileDetail(false)
      },
    })
  }

  const loading = sessionStatus === 'loading' || isLoading

  return (
    <div className="rq-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: SURFACE, fontFamily: F }}>
      <TopNav activeTab="review" />

      {/* Header band */}
      <header style={{ position: 'relative', flexShrink: 0, overflow: 'hidden', background: '#1B2533' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1559510981-10719ce4266a?q=80&w=1600&auto=format&fit=crop"
          alt="" aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(27,37,51,0.96) 0%, rgba(27,37,51,0.88) 45%, rgba(27,37,51,0.55) 100%)' }} />
        <div className="rq-header-inner" style={{ position: 'relative', padding: '22px 32px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8CC8F0' }}>Engineer review</p>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Review queue</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', maxWidth: 620, lineHeight: 1.5 }}>
              Answers that recommend action on the pipeline wait here until an engineer approves, edits or rejects them. Nothing reaches an operator before that.
            </p>
          </div>
          {!loading && (
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <span><strong style={{ fontSize: 20, color: '#fff', marginRight: 6 }}>{counts.PENDING}</strong>awaiting review</span>
              {highRisk > 0 && <span><strong style={{ fontSize: 20, color: '#FDA29B', marginRight: 6 }}>{highRisk}</strong>high risk</span>}
              <span><strong style={{ fontSize: 20, color: '#fff', marginRight: 6 }}>{counts.APPROVED}</strong>approved</span>
            </p>
          )}
        </div>
      </header>

      {/* Workspace: the queue on the left, the selected answer on the right */}
      <div className={`rq-workspace${mobileDetail ? ' rq-show-detail' : ''}`} style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <aside className="rq-queue" style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: `1px solid ${LINE}` }}>
          <nav aria-label="Filter" style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: `1px solid ${LINE}`, overflowX: 'auto' }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => { setFilter(f.key); setSelectedId(null) }}
                  style={{
                    fontFamily: F, fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap',
                    padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    background: active ? '#E6F1FA' : 'transparent', color: active ? BLUE : MUTED,
                  }}
                >
                  {f.label} <span style={{ fontWeight: 600, color: active ? BLUE : '#9AA4B2' }}>{counts[f.key]}</span>
                </button>
              )
            })}
          </nav>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ padding: 24, color: MUTED, fontSize: 14 }}>Loading the queue…</p>
            ) : visible.length === 0 ? (
              <p style={{ padding: 24, color: MUTED, fontSize: 14, lineHeight: 1.5 }}>
                {filter === 'PENDING' ? 'Nothing is waiting for review.' : 'No answers with this status yet.'}
              </p>
            ) : (
              <QueueList items={visible} selectedId={selected?.id ?? null} onSelect={id => { setSelectedId(id); setMobileDetail(true) }} />
            )}
          </div>
          <p className="rq-keys" style={{ margin: 0, padding: '8px 14px', borderTop: `1px solid ${LINE}`, fontSize: 11.5, color: '#9AA4B2' }}>
            Use ↑ and ↓ to move through the queue
          </p>
        </aside>

        <main className="rq-detail" style={{ flex: 1, minWidth: 0, background: '#fff' }}>
          {selected ? (
            <ReviewDetail
              key={selected.id}
              item={selected}
              onDecide={decide}
              deciding={deciding}
              onOpenSource={id => setSources({ open: true, activeId: id })}
              onBack={() => setMobileDetail(false)}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
              <EmptyQueueArt />
              <h2 style={{ margin: '22px 0 6px', fontSize: 18, fontWeight: 650, color: INK }}>
                {loading ? 'Loading…' : filter === 'PENDING' ? 'All clear' : 'Nothing to show'}
              </h2>
              {!loading && (
                <p style={{ margin: 0, maxWidth: 380, fontSize: 14, lineHeight: 1.55, color: MUTED }}>
                  {filter === 'PENDING'
                    ? 'No answers are waiting for sign-off. Held answers appear here as soon as they are generated.'
                    : 'Answers you decide on are listed here.'}
                </p>
              )}
            </div>
          )}
        </main>
      </div>

      {selected && (
        <SourcePanel
          citations={selected.citations_json ?? []}
          open={sources.open}
          activeId={sources.activeId}
          onClose={() => setSources({ open: false, activeId: null })}
        />
      )}

      <style>{`
        .rq-row:hover { background: #F7F9FB !important; }
        .rq-row:focus-visible, .rq-source:focus-visible { outline: 2px solid ${BLUE}; outline-offset: -2px; }
        .rq-source:hover { background: #F7F9FB !important; }
        .rq-answer > :first-child { margin-top: 0; }
        .rq-back { display: none !important; }
        @media (max-width: 900px) {
          .rq-page { height: auto !important; min-height: 100vh; }
          .rq-workspace { display: block !important; }
          .rq-queue { width: auto !important; border-right: none !important; }
          .rq-detail { display: none; }
          .rq-show-detail .rq-queue { display: none !important; }
          .rq-show-detail .rq-detail { display: block; }
          .rq-back { display: inline-flex !important; }
          .rq-keys { display: none; }
          .rq-header-inner { padding: 18px 16px !important; }
          .rq-detail-body { padding: 20px 16px 24px !important; }
          .rq-decision { padding: 12px 16px !important; position: sticky; bottom: 0; }
        }
      `}</style>
    </div>
  )
}
