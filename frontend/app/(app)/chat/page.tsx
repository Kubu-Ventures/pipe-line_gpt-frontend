'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSession } from 'next-auth/react'
import { Activity, Zap, TrendingUp, Shield, Globe } from 'lucide-react'
import { useSSE } from '@/hooks/useSSE'
import { ChatInput } from './components/ChatInput'
import { MessageBubble } from './components/MessageBubble'
import { CitationPanel } from './components/CitationPanel'
import { HITLBanner } from './components/HITLBanner'
import type { Citation, QueryFilters } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  hitlRequired?: boolean
}

const exampleQueries = [
  { icon: TrendingUp, text: 'Hazardous liquid incidents in Texas 2015–2023 — top 3 causes?' },
  { icon: Activity, text: 'Compare corrosion rates: gas transmission vs hazardous liquid, last 10 years' },
  { icon: Shield, text: 'What are the key integrity risks for offshore hydrocarbon pipelines?' },
  { icon: Globe, text: 'Quais são os principais riscos de integridade para dutos costeiros?' },
]

export default function ChatPage() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''
  const { fullText, citations, hitlRequired, isStreaming, error, submit, reset } = useSSE()
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId] = useState(() => uuidv4())
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamingIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, fullText])

  // When streaming completes, finalise the assistant message
  useEffect(() => {
    if (!isStreaming && fullText && streamingIdRef.current) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, content: fullText, citations, hitlRequired }
            : m,
        ),
      )
      streamingIdRef.current = null
    }
  }, [isStreaming, fullText, citations, hitlRequired])

  const handleSubmit = useCallback(
    async (question: string, language: string, filters: QueryFilters) => {
      reset()
      const userMsg: Message = { id: uuidv4(), role: 'user', content: question }
      const assistantId = uuidv4()
      streamingIdRef.current = assistantId
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setActiveCitation(null)

      await submit({ question, language, session_id: sessionId, filters }, token)
    },
    [reset, submit, sessionId, token],
  )

  // Keep streaming assistant message updated
  const displayMessages = messages.map((m) =>
    m.id === streamingIdRef.current ? { ...m, content: fullText } : m,
  )

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              {/* Watermark */}
              <div className="flex flex-col items-center gap-3 opacity-60">
                <div className="w-16 h-16 rounded-2xl bg-[#1D6FD9]/10 border border-[#1D6FD9]/20 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-[#1D6FD9]" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#E8EDF4] tracking-tight">
                    <span className="text-[#8B9BB4] font-normal">Pipeline</span>
                    <span className="text-[#1D6FD9] font-bold">GPT</span>
                  </p>
                  <p className="text-sm text-[#8B9BB4] mt-1">
                    Ask anything about your pipeline integrity data
                  </p>
                </div>
              </div>

              {/* Example queries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {exampleQueries.map(({ icon: Icon, text }) => (
                  <button
                    key={text}
                    onClick={() => handleSubmit(text, 'en', {})}
                    className="flex items-start gap-3 text-left px-4 py-3 rounded-xl border border-[#1C2E4A] bg-[#0A1628] hover:border-[#2A4270] hover:bg-[#0F1E38] transition-all text-sm text-[#8B9BB4] hover:text-[#E8EDF4]"
                  >
                    <Icon className="w-4 h-4 text-[#1D6FD9] shrink-0 mt-0.5" />
                    {text}
                  </button>
                ))}
              </div>

              <p className="text-xs text-[#4A5A72] text-center max-w-md">
                Responses are grounded in ingested PHMSA, ILI, and SCADA data.
                Safety-critical recommendations route through engineer review automatically.
              </p>
            </div>
          ) : (
            displayMessages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                citations={m.citations}
                isStreaming={m.id === streamingIdRef.current && isStreaming}
                onCitationClick={setActiveCitation}
              />
            ))
          )}
          {error && (
            <div className="mx-4 px-4 py-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[#DC2626]/30 text-sm text-[#DC2626]">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* HITL Banner */}
        {hitlRequired && <HITLBanner />}

        {/* Input */}
        <ChatInput
          onSubmit={handleSubmit}
          isStreaming={isStreaming}
          disabled={hitlRequired}
        />
      </div>

      {/* Citation drawer */}
      {activeCitation && (
        <CitationPanel
          citation={activeCitation}
          onClose={() => setActiveCitation(null)}
        />
      )}
    </div>
  )
}
