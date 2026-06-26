'use client'

import { useState, useCallback, useRef } from 'react'
import type { Citation, QueryRequest } from '@/lib/api'
import { API_BASE } from '@/lib/api'

export interface SSEState {
  fullText: string
  citations: Citation[]
  hitlRequired: boolean
  isStreaming: boolean
  queryId: string | null
  error: string | null
}

export interface UseSSEReturn extends SSEState {
  submit: (body: QueryRequest, token: string) => Promise<void>
  reset: () => void
}

export function useSSE(): UseSSEReturn {
  const [fullText, setFullText] = useState('')
  const [citations, setCitations] = useState<Citation[]>([])
  const [hitlRequired, setHitlRequired] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [queryId, setQueryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    setFullText('')
    setCitations([])
    setHitlRequired(false)
    setIsStreaming(false)
    setQueryId(null)
    setError(null)
    abortRef.current?.abort()
  }, [])

  const submit = useCallback(async (body: QueryRequest, token: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setFullText('')
    setCitations([])
    setHitlRequired(false)
    setQueryId(null)
    setError(null)
    setIsStreaming(true)

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Query failed: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const jsonStr = trimmed.slice(6)
          if (jsonStr === '[DONE]') continue

          try {
            const chunk = JSON.parse(jsonStr) as {
              delta?: string
              citations?: Citation[]
              hitl_required?: boolean
              query_id?: string
              done?: boolean
              cached?: boolean
            }

            if (chunk.query_id) setQueryId(chunk.query_id)
            if (chunk.hitl_required) setHitlRequired(true)

            if (chunk.done) {
              if (chunk.citations?.length) setCitations(chunk.citations)
            } else if (chunk.delta) {
              setFullText(prev => prev + chunk.delta)
            } else if (chunk.cached && chunk.delta !== undefined) {
              setFullText(chunk.delta ?? '')
              if (chunk.citations?.length) setCitations(chunk.citations)
            }
          } catch {
            // Malformed chunk — skip
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsStreaming(false)
    }
  }, [])

  return { fullText, citations, hitlRequired, isStreaming, queryId, error, submit, reset }
}
