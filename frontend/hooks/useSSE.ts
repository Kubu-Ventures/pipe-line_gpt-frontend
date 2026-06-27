'use client'

import { useState, useCallback, useRef } from 'react'
import { buildQueryRequest, type Citation, type QueryFilters } from '@/lib/api'

interface SSEState {
  fullText: string
  citations: Citation[]
  hitlRequired: boolean
  queryId: string | null
  isStreaming: boolean
  error: string | null
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    fullText: '',
    citations: [],
    hitlRequired: false,
    queryId: null,
    isStreaming: false,
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ fullText: '', citations: [], hitlRequired: false, queryId: null, isStreaming: false, error: null })
  }, [])

  const submit = useCallback(
    async (question: string, sessionId: string, language: string, filters: QueryFilters, token: string) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setState(s => ({ ...s, fullText: '', citations: [], hitlRequired: false, isStreaming: true, error: null }))

      const { url, init } = buildQueryRequest(question, sessionId, language, filters, token)

      try {
        const res = await fetch(url, { ...init, signal: controller.signal })
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        if (!res.body) throw new Error('No response body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6))
              setState(s => ({
                ...s,
                fullText: json.done ? s.fullText : s.fullText + (json.delta ?? ''),
                citations: json.citations?.length ? json.citations : s.citations,
                hitlRequired: json.hitl_required ?? s.hitlRequired,
                queryId: json.query_id ?? s.queryId,
                isStreaming: !json.done,
              }))
            } catch {
              // malformed line — skip
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setState(s => ({ ...s, error: err.message, isStreaming: false }))
        }
      } finally {
        setState(s => ({ ...s, isStreaming: false }))
      }
    },
    []
  )

  return { ...state, submit, reset }
}
