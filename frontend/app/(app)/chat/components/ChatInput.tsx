'use client'

import { useRef, useEffect, useState, KeyboardEvent } from 'react'
import { Send, SlidersHorizontal, ChevronDown, ChevronUp, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { QueryFilters } from '@/lib/api'

interface ChatInputProps {
  onSubmit: (question: string, language: string, filters: QueryFilters) => void
  isStreaming: boolean
  disabled?: boolean
}

const languages = [
  { code: 'en', label: 'EN — English' },
  { code: 'es', label: 'ES — Español' },
  { code: 'pt', label: 'PT — Português' },
  { code: 'de', label: 'DE — Deutsch' },
  { code: 'fr', label: 'FR — Français' },
  { code: 'ar', label: 'AR — العربية' },
]

export function ChatInput({ onSubmit, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [language, setLanguage] = useState('en')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<QueryFilters>({})

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
    }
  }, [value])

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || isStreaming || disabled) return
    onSubmit(trimmed, language, filters)
    setValue('')
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isDisabled = disabled || isStreaming

  return (
    <div className="border-t border-[#1C2E4A] bg-[#050D1A] px-4 py-3 space-y-2">
      {/* Filters (collapsible) */}
      {showFilters && (
        <div className="grid grid-cols-3 gap-3 pb-2 border-b border-[#1C2E4A]">
          <div className="space-y-1">
            <Label className="text-xs">Pipeline Segment</Label>
            <Input
              placeholder="e.g. Segment 4B"
              className="h-8 text-xs"
              value={filters.pipeline_segment ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, pipeline_segment: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Commodity</Label>
            <Input
              placeholder="e.g. Natural Gas"
              className="h-8 text-xs"
              value={filters.commodity ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, commodity: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Date Range</Label>
            <Input
              placeholder="e.g. 2015–2023"
              className="h-8 text-xs"
              onChange={(e) => {
                const [from, to] = e.target.value.split('–').map((s) => s.trim())
                setFilters((f) => ({ ...f, date_range: { from: from ?? '', to: to ?? '' } }))
              }}
            />
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="w-full resize-none rounded-xl border border-[#1C2E4A] bg-[#0A1628] px-4 py-3 pr-12 text-sm text-[#E8EDF4] placeholder:text-[#4A5A72] focus:outline-none focus:border-[#1D6FD9] transition-colors min-h-[46px] max-h-[140px] leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={
              disabled
                ? 'Response is under review — please wait for engineer approval'
                : 'Ask anything about your pipeline integrity data… (Shift+Enter for newline)'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            disabled={isDisabled}
            rows={1}
          />
        </div>

        {/* Language */}
        <div className="relative shrink-0">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4A5A72] pointer-events-none" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-[46px] appearance-none pl-8 pr-3 rounded-xl border border-[#1C2E4A] bg-[#0A1628] text-xs text-[#8B9BB4] focus:outline-none focus:border-[#1D6FD9] cursor-pointer"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Filters toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-[46px] w-[46px] rounded-xl"
          onClick={() => setShowFilters((v) => !v)}
          title="Toggle filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {showFilters ? (
            <ChevronUp className="w-3 h-3 absolute bottom-1.5 right-1.5 text-[#1D6FD9]" />
          ) : (
            <ChevronDown className="w-3 h-3 absolute bottom-1.5 right-1.5 text-[#4A5A72]" />
          )}
        </Button>

        {/* Send */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled || !value.trim()}
          className="shrink-0 h-[46px] w-[46px] rounded-xl p-0"
        >
          {isStreaming ? (
            <span className="w-3 h-3 rounded-sm bg-white animate-pulse" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-[10px] text-[#4A5A72] text-center">
        PipelineGPT responses are grounded in ingested source data and may trigger engineer review for safety-critical recommendations.
      </p>
    </div>
  )
}
