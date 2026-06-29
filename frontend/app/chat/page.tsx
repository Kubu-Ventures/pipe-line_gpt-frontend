'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from 'next-auth/react'
import { TrendingUp, Activity, Shield, Globe, Upload, ArrowRight, Flag, History, Info, ChevronDown, ChevronUp, CheckCircle, Clock, Edit3, XCircle } from 'lucide-react'
import Link from 'next/link'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { ChatInput } from './components/ChatInput'
import { MessageBubble } from './components/MessageBubble'
import { CitationPanel } from './components/CitationPanel'
import { useSSE } from '@/hooks/useSSE'
import { getQueryHistory } from '@/lib/api'
import type { Citation, QueryFilters } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  hitlRequired?: boolean
  queryId?: string
  queryStatus?: 'PENDING' | 'PROCESSING' | 'UNDER_REVIEW' | 'DELIVERED' | 'REJECTED'
  reviewDecision?: 'APPROVE' | 'EDIT' | 'REJECT' | null
  reviewReason?: string | null
  timestamp: Date
  fromHistory?: boolean
}

const STATUS_LEGEND = [
  {
    icon: CheckCircle,
    color: '#1A7A4A',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    label: 'Auto-cleared',
    desc: 'AI confidence is high — no engineer review needed. Safe for operational use.',
  },
  {
    icon: Clock,
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
    label: 'Pending review',
    desc: 'Flagged for engineer sign-off. Do not use for operational decisions yet.',
  },
  {
    icon: CheckCircle,
    color: '#1A7A4A',
    bg: '#D1FAE5',
    border: '#6EE7B7',
    label: 'Engineer approved',
    desc: 'A qualified engineer reviewed and approved this response. Cleared for use.',
  },
  {
    icon: Edit3,
    color: '#1D4ED8',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    label: 'Engineer edited',
    desc: 'Engineer corrected or amended the AI response before approving.',
  },
  {
    icon: XCircle,
    color: '#991B1B',
    bg: '#FEE2E2',
    border: '#FECACA',
    label: 'Rejected',
    desc: 'Engineer determined this response is inaccurate. Do not use.',
  },
]

function StatusLegend({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 24px', borderBottom: '1px solid #E4E8EF', background: '#F8FAFB' }}>
        {STATUS_LEGEND.map(({ icon: Icon, color, bg, border, label }) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color, background: bg, border: `1px solid ${border}`, padding: '3px 9px', borderRadius: 3 }}>
            <Icon size={10} /> {label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, width: '100%', marginTop: 28 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Info size={12} /> Response status guide
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {STATUS_LEGEND.map(({ icon: Icon, color, bg, border, label, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: bg, border: `1px solid ${border}`, flexShrink: 0, marginTop: 1 }}>
              <Icon size={12} color={color} />
            </span>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color, margin: 0, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: '0.6875rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EXAMPLE_QUERIES = [
  { icon: TrendingUp, text: 'How many hazardous liquid incidents in Texas 2015–2023, and top 3 causes?',   tag: 'Trend Analysis' },
  { icon: Activity,   text: 'Compare corrosion rates: natural gas transmission vs hazardous liquid, last 10 years.', tag: 'Comparative' },
  { icon: Shield,     text: 'What are the key integrity risks for offshore hydrocarbon pipelines near HCAs?', tag: 'Risk Assessment' },
  { icon: Globe,      text: 'Quais são os principais riscos de integridade para dutos costeiros?',            tag: 'Multilingual' },
]

export default function ChatPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  const { fullText, citations, hitlRequired, queryId: sseQueryId, isStreaming, error, submit, reset } = useSSE()

  const [messages, setMessages] = useState<Message[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [sessionId] = useState(() => uuidv4())
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const streamIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const historyLoadedRef = useRef(false)

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, fullText])

  // ── Load history on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!token || historyLoadedRef.current) return
    historyLoadedRef.current = true
    setHistoryLoading(true)
    getQueryHistory(token)
      .then(items => {
        if (items.length === 0) return
        const msgs: Message[] = []
        for (const item of items) {
          msgs.push({
            id: `hist-q-${item.query_id}`,
            role: 'user',
            content: item.question,
            timestamp: new Date(item.asked_at),
            fromHistory: true,
          })
          msgs.push({
            id: `hist-a-${item.query_id}`,
            role: 'assistant',
            // show final (approved/edited) text if available, otherwise original
            content: item.final_text ?? item.answer_text,
            citations: item.citations,
            hitlRequired: item.hitl_required,
            queryId: item.query_id,
            queryStatus: item.status,
            reviewDecision: item.decision,
            reviewReason: item.reason,
            timestamp: new Date(item.asked_at),
            fromHistory: true,
          })
        }
        setMessages(msgs)
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [token])

  // ── Poll for status updates on UNDER_REVIEW messages ───────────────────
  useEffect(() => {
    if (!token) return
    const pendingIds = messages
      .filter(m => m.queryStatus === 'UNDER_REVIEW' && m.queryId)
      .map(m => m.queryId!)
    if (pendingIds.length === 0) return

    const interval = setInterval(() => {
      getQueryHistory(token).then(items => {
        setMessages(prev => prev.map(m => {
          if (!m.queryId || !pendingIds.includes(m.queryId)) return m
          const updated = items.find(i => i.query_id === m.queryId)
          if (!updated || updated.status === 'UNDER_REVIEW') return m
          return {
            ...m,
            content: updated.final_text ?? updated.answer_text,
            queryStatus: updated.status,
            reviewDecision: updated.decision,
            reviewReason: updated.reason,
          }
        }))
      }).catch(() => {})
    }, 30_000)

    return () => clearInterval(interval)
  }, [token, messages])

  // ── Finalise streaming message ───────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming && fullText && streamIdRef.current) {
      setMessages(prev =>
        prev.map(m =>
          m.id === streamIdRef.current
            ? {
                ...m,
                content: fullText,
                citations,
                hitlRequired,
                queryId: sseQueryId ?? undefined,
                queryStatus: hitlRequired ? 'UNDER_REVIEW' : 'DELIVERED',
              }
            : m
        )
      )
      streamIdRef.current = null
    }
  }, [isStreaming, fullText, citations, hitlRequired, sseQueryId])

  // ── Live-update streaming content ───────────────────────────────────────
  useEffect(() => {
    if (isStreaming && fullText && streamIdRef.current) {
      setMessages(prev =>
        prev.map(m => m.id === streamIdRef.current ? { ...m, content: fullText } : m)
      )
    }
  }, [fullText, isStreaming])

  // ── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (question: string, language: string, filters: QueryFilters) => {
      reset()
      const userMsg: Message = { id: uuidv4(), role: 'user', content: question, timestamp: new Date() }
      const aiId = uuidv4()
      streamIdRef.current = aiId
      const aiMsg: Message = { id: aiId, role: 'assistant', content: '', timestamp: new Date() }
      setMessages(prev => [...prev, userMsg, aiMsg])
      await submit(question, sessionId, language, filters, token)
    },
    [reset, submit, sessionId, token]
  )

  // ── Derived state ────────────────────────────────────────────────────────
  const isEmpty = messages.length === 0 && !historyLoading
  const flaggedCount = messages.filter(m => m.hitlRequired && !m.reviewDecision).length

  // Find index of first non-history message (for separator)
  const firstCurrentIdx = messages.findIndex(m => !m.fromHistory)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
      <TopNav activeTab="chat" />

      <div className="chat-hero">
        <PageHero
          step="Step 2 of 5 · AI Query"
          title="Pipeline Intelligence Chat"
          subtitle="Ask anything about your uploaded pipeline data in any language — ILI reports, SCADA, PHMSA incidents, GIS."
          compact
        />
      </div>

      <main className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px - 160px)' }}>

        {/* Message area */}
        <div style={{ flex: 1, overflow: 'auto', paddingTop: 24, paddingBottom: 8 }}>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8896A8' }}>
              <div style={{ display: 'inline-block', width: 22, height: 22, border: '3px solid #d4d6d8', borderTopColor: '#006eb5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 12 }} />
              <p style={{ fontSize: 14 }}>Loading your conversation history…</p>
            </div>
          ) : isEmpty ? (
            /* Empty state */
            <div className="chat-empty-state">
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#232e3e', letterSpacing: '-0.02em' }}>
                  <span style={{ fontWeight: 300 }}>Pipeline</span><span style={{ color: '#006eb5' }}>GPT</span>
                </div>
                <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>AI-powered pipeline integrity intelligence</p>
              </div>

              <div className="chat-notice" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '12px 16px', marginBottom: 24, maxWidth: 520, width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
                <Upload size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 3 }}>Have you uploaded your pipeline data yet?</p>
                  <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.55 }}>The AI can only answer questions about data that has been ingested. If you haven&apos;t done that yet, go to Step 1 first.</p>
                </div>
                <Link href="/ingest" className="chat-notice-btn" style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#92400E', background: '#FDE68A', border: '1px solid #F59E0B', borderRadius: 4, padding: '5px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Step 1: Upload <ArrowRight size={11} />
                </Link>
              </div>

              <p style={{ fontSize: '0.9375rem', color: '#8896A8', maxWidth: 460, lineHeight: 1.6, marginBottom: 24 }}>
                Ask anything about your pipeline data in any language — or try one of the examples below.
              </p>

              <div className="chat-example-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 640, width: '100%' }}>
                {EXAMPLE_QUERIES.map(({ icon: Icon, text, tag }) => (
                  <button key={tag} onClick={() => handleSubmit(text, 'EN', {})} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 16, background: '#FFFFFF', border: '1px solid #E4E8EF', borderLeft: '3px solid #006eb5', borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,93,170,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={13} color="#006eb5" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#006eb5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{tag}</span>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.5 }}>{text}</span>
                  </button>
                ))}
              </div>

              <StatusLegend />
            </div>
          ) : (
            <div style={{ paddingBottom: 16 }}>

              {/* Status legend toggle */}
              <div style={{ padding: '0 24px 4px' }}>
                <button
                  onClick={() => setLegendOpen(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', fontWeight: 600, color: '#8896A8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', userSelect: 'none' }}
                >
                  <Info size={11} />
                  Response status guide
                  {legendOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
                {legendOpen && (
                  <div style={{ marginTop: 8, marginBottom: 8 }}>
                    <StatusLegend compact />
                  </div>
                )}
              </div>

              {messages.map((msg, idx) => {
                const isFirstCurrent = idx === firstCurrentIdx && firstCurrentIdx > 0
                return (
                  <div key={msg.id}>
                    {/* History / current session separator */}
                    {isFirstCurrent && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px 20px', userSelect: 'none' }}>
                        <div style={{ flex: 1, height: 1, background: '#E4E8EF' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#8896A8', textTransform: 'uppercase', letterSpacing: '0.10em', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <History size={11} /> Current session
                        </span>
                        <div style={{ flex: 1, height: 1, background: '#E4E8EF' }} />
                      </div>
                    )}

                    <MessageBubble
                      role={msg.role}
                      content={msg.content}
                      citations={msg.citations}
                      isStreaming={isStreaming && msg.id === streamIdRef.current}
                      hitlRequired={msg.role === 'assistant' ? msg.hitlRequired : undefined}
                      queryStatus={msg.queryStatus}
                      reviewDecision={msg.reviewDecision}
                      reviewReason={msg.reviewReason}
                      timestamp={msg.timestamp}
                      fromHistory={msg.fromHistory}
                      onCitationClick={setActiveCitation}
                    />
                  </div>
                )
              })}

              {error && (
                <div style={{ margin: '0 24px 16px', padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, fontSize: '0.875rem', color: '#991B1B' }}>
                  Error: {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ flexShrink: 0, background: '#FFFFFF' }}>
          {flaggedCount > 0 && (
            <div className="chat-hitl-notice" style={{ borderTop: '1px solid #FDE68A', background: '#FFFBEB', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Flag size={13} color="#92400E" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#92400E', flex: 1 }}>
                <strong>{flaggedCount}</strong> response{flaggedCount !== 1 ? 's' : ''} pending engineer sign-off. Status updates automatically every 30 seconds.
              </span>
              <Link href="/review" style={{ fontSize: 12, fontWeight: 600, color: '#92400E', background: '#FDE68A', border: '1px solid #F59E0B', padding: '4px 12px', borderRadius: 3, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
                Review Queue <ArrowRight size={11} />
              </Link>
            </div>
          )}
          <ChatInput onSubmit={handleSubmit} disabled={isStreaming} isStreaming={isStreaming} />
        </div>
      </main>

      <CitationPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
