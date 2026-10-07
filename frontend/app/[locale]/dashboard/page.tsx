'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { TopNav } from '@/components/TopNav'
import { Footer } from '@/components/Footer'
import { listDocuments, type DocumentPage } from '@/lib/api'
import { DashboardView, type Insights, type RefreshProgress, type Stats } from './DashboardView'

const F = 'Inter, system-ui, sans-serif'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

/* ── Page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as string | undefined
  const token = (session as any)?.accessToken

  const [stats,           setStats]           = useState<Stats | null>(null)
  const [statsError,      setStatsError]      = useState<string | null>(null)
  const [insights,        setInsights]        = useState<Insights | null>(null)
  const [insightsError,   setInsightsError]   = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [refresh,         setRefresh]         = useState<RefreshProgress | null>(null)
  const [starting,        setStarting]        = useState(false)
  const [docPage,         setDocPage]         = useState<DocumentPage | null>(null)
  const [docsLoading,     setDocsLoading]     = useState(true)

  const loadInsights = useCallback(async () => {
    if (!token) return
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const r = await fetch(`${API_URL}/dashboard/insights`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(`${r.status}`)
      setInsights(await r.json())
    } catch {
      setInsightsError('Could not load the findings from your documents.')
    } finally {
      setInsightsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    setStatsError(null)
    fetch(`${API_URL}/health/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) { setStatsError(`Backend error ${r.status}`); return null }
        return r.json()
      })
      .then(d => { if (d) setStats(d) })
      .catch(() => setStatsError('Cannot reach the backend.'))
  }, [token])

  useEffect(() => { loadInsights() }, [loadInsights])

  useEffect(() => {
    if (!token) return
    setDocsLoading(true)
    // Most recent documents for the list; counts come from the whole knowledge base.
    listDocuments({ limit: 8 }, token)
      .then(setDocPage)
      .catch(() => setDocPage(null))
      .finally(() => setDocsLoading(false))
  }, [token])

  const refreshing = starting || refresh?.state === 'running'

  const loadRefreshStatus = useCallback(async (): Promise<RefreshProgress | null> => {
    if (!token) return null
    try {
      const r = await fetch(`${API_URL}/dashboard/insights/refresh`, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) return null
      const progress: RefreshProgress = await r.json()
      setRefresh(progress)
      return progress
    } catch {
      return null
    }
  }, [token])

  // Show a re-analysis already running (started by someone else, or before a reload)
  useEffect(() => { loadRefreshStatus() }, [loadRefreshStatus])

  // While it runs in the background, follow its progress and reload the insights when it ends
  useEffect(() => {
    if (refresh?.state !== 'running') return
    const id = setTimeout(async () => {
      const progress = await loadRefreshStatus()
      if (progress && progress.state !== 'running') loadInsights()
    }, 3000)
    return () => clearTimeout(id)
  }, [refresh, loadRefreshStatus, loadInsights])

  async function handleRefresh() {
    if (!token || refreshing) return
    setStarting(true)
    try {
      const r = await fetch(`${API_URL}/dashboard/insights/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const body = r.ok ? await r.json() : null
      if (body?.state) setRefresh(body)
      else await loadInsights()  // backends before the background refresh finish within the request
    } finally {
      setStarting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: F }}>
      <TopNav activeTab="dashboard" />
      <DashboardView
        role={role}
        stats={stats}
        statsError={statsError}
        insights={insights}
        insightsError={insightsError}
        insightsLoading={insightsLoading}
        docPage={docPage}
        docsLoading={docsLoading}
        refresh={refresh}
        starting={starting}
        onRefresh={handleRefresh}
      />
      <Footer />
    </div>
  )
}
