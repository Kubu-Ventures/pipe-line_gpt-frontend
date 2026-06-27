'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from 'next-auth/react'
import { TrendingUp, Activity, Shield, Globe, Upload, ArrowRight, Flag } from 'lucide-react'
import Link from 'next/link'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { ChatInput } from './components/ChatInput'
import { MessageBubble } from './components/MessageBubble'
import { CitationPanel } from './components/CitationPanel'
import { useSSE } from '@/hooks/useSSE'
import type { Citation, QueryFilters } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  hitlRequired?: boolean
  timestamp: Date
}

const EXAMPLE_QUERIES = [
  {
    icon: TrendingUp,
    text: 'How many hazardous liquid incidents in Texas 2015–2023, and top 3 causes?',
    tag: 'Trend Analysis',
  },
  {
    icon: Activity,
    text: 'Compare corrosion rates: natural gas transmission vs hazardous liquid, last 10 years.',
    tag: 'Comparative',
  },
  {
    icon: Shield,
    text: 'What are the key integrity risks for offshore hydrocarbon pipelines near HCAs?',
    tag: 'Risk Assessment',
  },
  {
    icon: Globe,
    text: 'Quais são os principais riscos de integridade para dutos costeiros?',
    tag: 'Multilingual',
  },
]

export default function ChatPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken ?? ''
  const { fullText, citations, hitlRequired, isStreaming, error, submit, reset } = useSSE()
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId] = useState(() => uuidv4())
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const streamIdRef = useRef<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, fullText])

  // Finalise streaming message
  useEffect(() => {
    if (!isStreaming && fullText && streamIdRef.current) {
      setMessages(prev =>
        prev.map(m =>
          m.id === streamIdRef.current
            ? { ...m, content: fullText, citations, hitlRequired }
            : m
        )
      )
      streamIdRef.current = null
    }
  }, [isStreaming, fullText, citations, hitlRequired])

  // Live-update streaming message content
  useEffect(() => {
    if (isStreaming && fullText && streamIdRef.current) {
      setMessages(prev =>
        prev.map(m =>
          m.id === streamIdRef.current ? { ...m, content: fullText } : m
        )
      )
    }
  }, [fullText, isStreaming])

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

  const isEmpty = messages.length === 0

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8F9FB' }}>
      <TopNav activeTab="chat" />

      <div className="chat-hero">
        <PageHero
          step="Step 2 of 5 · AI Query"
          title="Pipeline Intelligence Chat"
          subtitle="Ask anything about your uploaded pipeline data in plain English — ILI reports, SCADA, PHMSA incidents, GIS."
          compact
        />
      </div>

      <main className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px - 160px)' }}>
        {/* Message area */}
        <div style={{ flex: 1, overflow: 'auto', paddingTop: '24px', paddingBottom: '8px' }}>
          {isEmpty ? (
            /* Empty state */
            <div className="chat-empty-state">
              {/* Logo mark */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1A1A2A', letterSpacing: '-0.02em' }}>
                  <span style={{ fontWeight: 300 }}>Pipeline</span><span style={{ color: '#005DAA' }}>GPT</span>
                </div>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: 4 }}>AI-powered pipeline integrity intelligence</p>
              </div>

              {/* Data prerequisite notice */}
              <div className="chat-notice" style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 6,
                padding: '12px 16px',
                marginBottom: 24,
                maxWidth: 520,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                textAlign: 'left',
              }}>
                <Upload size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 3 }}>
                    Have you uploaded your pipeline data yet?
                  </p>
                  <p style={{ fontSize: 13, color: '#78350F', lineHeight: 1.55 }}>
                    The AI can only answer questions about data that has been ingested. If you haven&apos;t done that yet, go to Step 1 first.
                  </p>
                </div>
                <Link href="/ingest" className="chat-notice-btn" style={{
                  whiteSpace: 'nowrap', flexShrink: 0,
                  fontSize: 12, fontWeight: 600, color: '#92400E',
                  background: '#FDE68A', border: '1px solid #F59E0B',
                  borderRadius: 4, padding: '5px 12px', textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  Step 1: Upload <ArrowRight size={11} />
                </Link>
              </div>

              <p style={{ fontSize: '0.9375rem', color: '#8896A8', maxWidth: '460px', lineHeight: 1.6, marginBottom: '24px' }}>
                Ask anything about your pipeline data in plain English — or try one of the examples below.
              </p>

              {/* Example queries 2×2 */}
              <div
                className="chat-example-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  maxWidth: '640px',
                  width: '100%',
                }}
              >
                {EXAMPLE_QUERIES.map(({ icon: Icon, text, tag }) => (
                  <button
                    key={tag}
                    onClick={() => handleSubmit(text, 'EN', {})}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '16px',
                      background: '#FFFFFF',
                      border: '1px solid #E4E8EF',
                      borderLeft: '3px solid #005DAA',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'box-shadow 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,93,170,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={13} color="#005DAA" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#005DAA', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {tag}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#4A5568', lineHeight: 1.5 }}>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages */
            <div style={{ paddingBottom: '16px' }}>
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  citations={msg.citations}
                  isStreaming={isStreaming && msg.id === streamIdRef.current}
                  hitlRequired={msg.role === 'assistant' ? msg.hitlRequired : undefined}
                  timestamp={msg.timestamp}
                  onCitationClick={setActiveCitation}
                />
              ))}
              {error && (
                <div style={{ margin: '0 24px 16px', padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '6px', fontSize: '0.875rem', color: '#991B1B' }}>
                  Error: {error}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ flexShrink: 0, background: '#FFFFFF' }}>
          {/* Quiet persistent review notice — shown when any message in this session was flagged */}
          {messages.some(m => m.hitlRequired) && (
            <div className="chat-hitl-notice" style={{
              borderTop: '1px solid #FDE68A',
              background: '#FFFBEB',
              padding: '8px 24px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Flag size={13} color="#92400E" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#92400E', flex: 1 }}>
                <strong>{messages.filter(m => m.hitlRequired).length}</strong> response{messages.filter(m => m.hitlRequired).length !== 1 ? 's' : ''} in this session {messages.filter(m => m.hitlRequired).length !== 1 ? 'are' : 'is'} flagged for engineer sign-off before operational use. You can keep asking questions.
              </span>
              <Link href="/review" style={{
                fontSize: 12, fontWeight: 600, color: '#92400E',
                background: '#FDE68A', border: '1px solid #F59E0B',
                padding: '4px 12px', borderRadius: 3, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              }}>
                Review Queue <ArrowRight size={11} />
              </Link>
            </div>
          )}
          <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
        </div>
      </main>

      {/* Citation panel */}
      <CitationPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  )
}
