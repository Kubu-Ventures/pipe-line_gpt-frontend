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
  const [value, setValue] = useState('')
  const [lang, setLang] = useState('EN')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<QueryFilters>({})
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <div style={{ background: '#FFFFFF', borderTop: '1px solid #E4E8EF', padding: '16px 0 20px' }}>
      <div className="chat-input-inner" style={{ maxWidth: '860px', margin: '0 auto', padding: '0 24px' }}>

        {/* Streaming status bar */}
        {isStreaming && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 10, padding: '8px 14px',
            background: '#F0F7FF', border: '1px solid #BFDBFE',
            borderRadius: 6,
            animation: 'status-shimmer 2s ease-in-out infinite',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#006eb5', flexShrink: 0,
              animation: 'dot-pulse 1.2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.8125rem', color: '#1D4ED8', fontWeight: 500 }}>
              PipelineGPT is generating a response — please wait…
            </span>
          </div>
        )}
        {/* Optional filters row */}
        {showFilters && (
          <div
            className="chat-filter-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '12px',
              padding: '14px',
              background: '#F8F9FB',
              border: '1px solid #E4E8EF',
              borderRadius: '6px',
            }}
          >
            {[
              { label: 'Pipeline Segment', key: 'pipeline_segment', placeholder: 'e.g. Segment 4B' },
              { label: 'Commodity', key: 'commodity', placeholder: 'e.g. Crude Oil' },
              { label: 'From Year', key: 'date_from', placeholder: 'e.g. 2015' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8896A8', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type="text"
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #C8D0DC', borderRadius: '4px', fontSize: '0.875rem', color: '#1A1A2A', outline: 'none' }}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value || undefined }))}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main input area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '10px',
            background: '#FFFFFF',
            border: '1px solid #C8D0DC',
            borderRadius: '8px',
            padding: '10px 12px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocusCapture={e => {
            ;(e.currentTarget as HTMLElement).style.borderColor = '#006eb5'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(0,93,170,0.08)'
          }}
          onBlurCapture={e => {
            ;(e.currentTarget as HTMLElement).style.borderColor = '#C8D0DC'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}
        >
          {/* Language selector */}
          <div style={{ flexShrink: 0 }}>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="chat-lang-select"
              style={{
                padding: '4px 6px',
                border: '1px solid #E4E8EF',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#4A5568',
                background: '#F8F9FB',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => { setValue(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask anything about your pipeline integrity data…"
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

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setShowFilters(v => !v)}
              title="Query filters"
              className="chat-filter-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: '6px',
                border: 'none',
                background: showFilters ? '#dff0ff' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                color: showFilters ? '#006eb5' : '#8896A8',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <SlidersHorizontal size={16} />
              <span className="chat-filter-label">Filters</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || disabled}
              className="chat-send-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                background: !value.trim() || disabled ? '#E4E8EF' : '#006eb5',
                color: !value.trim() || disabled ? '#8896A8' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !value.trim() || disabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (value.trim() && !disabled) e.currentTarget.style.background = '#004A8F' }}
              onMouseLeave={e => { if (value.trim() && !disabled) e.currentTarget.style.background = '#006eb5' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        <p className="chat-hint" style={{ fontSize: '0.75rem', color: '#C8D0DC', textAlign: 'center', marginTop: '8px' }}>
          Press <kbd style={{ padding: '1px 5px', background: '#F2F4F7', border: '1px solid #E4E8EF', borderRadius: '3px', fontSize: '0.6875rem' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 5px', background: '#F2F4F7', border: '1px solid #E4E8EF', borderRadius: '3px', fontSize: '0.6875rem' }}>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
