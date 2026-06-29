'use client'

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { Send, SlidersHorizontal, Globe } from 'lucide-react'
import type { QueryFilters } from '@/lib/api'

interface ChatInputProps {
  onSubmit: (question: string, language: string, filters: QueryFilters) => void
  disabled?: boolean
  isStreaming?: boolean
}

const LANGUAGES = ['EN', 'FR', 'ES', 'AR', 'ZH', 'RU', 'PT', 'DE', 'JA', 'HI']

export function ChatInput({ onSubmit, disabled, isStreaming }: ChatInputProps) {
  const [value, setValue]           = useState('')
  const [lang, setLang]             = useState('EN')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters]       = useState<QueryFilters>({})
  const [focused, setFocused]       = useState(false)
  const textareaRef                 = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const handleSubmit = useCallback(() => {
    const q = value.trim()
    if (!q || disabled) return
    onSubmit(q, lang, filters)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [value, lang, filters, disabled, onSubmit])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const canSend = !!value.trim() && !disabled

  return (
    <div style={{ background: '#FFFFFF' }}>

      {/* Streaming indicator — thin animated bar replaces the full status block */}
      <div style={{
        height: 2,
        background: isStreaming
          ? 'linear-gradient(90deg, #006eb5 0%, #60d4f2 50%, #006eb5 100%)'
          : '#E4E8EF',
        backgroundSize: '200% 100%',
        animation: isStreaming ? 'slide-gradient 1.6s linear infinite' : 'none',
        transition: 'background 0.3s',
      }} />

      <div className="chat-input-inner" style={{ maxWidth: 860, margin: '0 auto', padding: '12px 24px 14px' }}>

        {/* Filter panel — opens above the input row */}
        {showFilters && (
          <div
            className="chat-filter-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 10,
              padding: '12px 14px',
              background: '#F8F9FB',
              border: '1px solid #E4E8EF',
              borderRadius: 6,
            }}
          >
            {[
              { label: 'Pipeline Segment', key: 'pipeline_segment', placeholder: 'e.g. Segment 4B' },
              { label: 'Commodity',        key: 'commodity',        placeholder: 'e.g. Crude Oil'  },
              { label: 'From Year',        key: 'date_from',        placeholder: 'e.g. 2015'       },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: 4 }}>
                  {label}
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #C8D0DC', borderRadius: 4, fontSize: '0.875rem', color: '#1A1A2A', outline: 'none', fontFamily: 'inherit' }}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value || undefined }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Input box — just textarea + send */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            background: '#FFFFFF',
            border: `1.5px solid ${focused ? '#006eb5' : '#D1D9E0'}`,
            boxShadow: focused ? '0 0 0 3px rgba(0,93,170,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
            borderRadius: 10,
            padding: '10px 12px 10px 16px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            placeholder={isStreaming ? 'Generating response…' : 'Ask anything about your pipeline integrity data…'}
            rows={1}
            className="chat-textarea"
            style={{
              flex: 1,
              resize: 'none',
              border: 'none',
              outline: 'none',
              fontSize: '0.9375rem',
              color: '#1A1A2A',
              lineHeight: 1.6,
              background: 'transparent',
              fontFamily: 'inherit',
              padding: '2px 0',
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            className="chat-send-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: canSend ? '#006eb5' : '#F0F2F5',
              color: canSend ? '#FFFFFF' : '#B0BAC5',
              border: 'none',
              borderRadius: 8,
              cursor: canSend ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (canSend) e.currentTarget.style.background = '#004A8F' }}
            onMouseLeave={e => { if (canSend) e.currentTarget.style.background = '#006eb5' }}
          >
            <Send size={15} />
          </button>
        </div>

        {/* Secondary row: language + filters + keyboard hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>

          {/* Language picker — icon + dropdown, no box */}
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            onClick={() => {}} // handled by the select inside
            tabIndex={-1}
          >
            <Globe size={12} color="#A0AEC0" />
          </button>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="chat-lang-select"
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: lang !== 'EN' ? '#006eb5' : '#8896A8',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit',
              marginLeft: -6,
            }}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <span style={{ width: 1, height: 12, background: '#E4E8EF', flexShrink: 0 }} />

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="chat-filter-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: showFilters ? '#006eb5' : '#A0AEC0',
              transition: 'color 0.15s',
            }}
          >
            <SlidersHorizontal size={11} />
            <span className="chat-filter-label">Filters</span>
          </button>

          <span style={{ flex: 1 }} />

          {/* Keyboard hint */}
          <span className="chat-hint" style={{ fontSize: '0.6875rem', color: '#D1D5DB' }}>
            Enter to send · Shift+Enter for new line
          </span>
        </div>

      </div>
    </div>
  )
}
