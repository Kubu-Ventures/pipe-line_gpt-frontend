const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = options
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(rest.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export interface QueryFilters {
  pipeline_segment?: string
  date_range?: [string, string]
  commodity?: string
}

export interface Citation {
  source_id: string
  text: string          // excerpt from the retrieved chunk (backend field: excerpt)
  document_id: string
  filename: string
  chunk_index?: number
  page_ref?: string
  section_label?: string
  date?: string
  segment?: string
}

export interface ReviewItem {
  id: string
  response_id: string
  query_id: string
  question_raw: string
  answer_text: string
  confidence_score: number
  citations_json: Citation[]
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW'
  status: string
  created_at: string
  user_email?: string
  chunk_count?: number
  decision?: string
}

export interface AuditEvent {
  id: string
  event_type: string
  actor_id: string
  target_id: string
  target_type: string
  payload_json: Record<string, unknown>
  ip_address: string
  created_at: string
}

export interface DashboardStats {
  total_queries: number
  pending_reviews: number
  avg_confidence: number
  documents_ingested: number
  queries_by_day: { date: string; count: number }[]
  incidents_by_year: { year: number; count: number }[]
  recent_events: AuditEvent[]
}

// Auth
export async function loginUser(email: string, password: string) {
  return apiFetch<{ access_token: string; user_id: string; email: string; role: string; name?: string }>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  )
}

// Query — returns raw Response for SSE streaming
export function buildQueryRequest(
  question: string,
  sessionId: string,
  language: string,
  filters: QueryFilters,
  token: string
): { url: string; init: RequestInit } {
  return {
    url: `${API_BASE}/query`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question, session_id: sessionId, language, filters }),
    },
  }
}

// Review
export async function getReviewQueue(status?: string, token?: string): Promise<ReviewItem[]> {
  const qs = status && status !== 'all' ? `?status=${status}` : ''
  return apiFetch<ReviewItem[]>(`/review${qs}`, { token })
}

export async function submitDecision(
  queryId: string,
  decision: { decision: 'APPROVE' | 'EDIT' | 'REJECT'; final_text?: string; reason?: string },
  token?: string
): Promise<void> {
  return apiFetch(`/review/${queryId}`, { method: 'POST', body: JSON.stringify(decision), token })
}

// Ingest
export async function ingestFile(file: File, token?: string): Promise<{ task_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { Authorization: token ? `Bearer ${token}` : '' },
    body: form,
  })
  if (!res.ok) throw new Error(`Ingest error ${res.status}`)
  return res.json()
}

export async function syncPHMSA(token?: string): Promise<{ task_id: string }> {
  return apiFetch('/ingest/phmsa-sync', { method: 'POST', token })
}

export async function getIngestHistory(token?: string) {
  return apiFetch<any[]>('/ingest/history', { token })
}

// Audit
export async function getAuditLog(
  params: { event_type?: string; actor?: string; from?: string; to?: string; page?: number },
  token?: string
) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
  ).toString()
  return apiFetch<{ items: AuditEvent[]; total: number }>(`/audit?${qs}`, { token })
}

// Dashboard
export async function getDashboardStats(token?: string): Promise<DashboardStats> {
  return apiFetch('/health/stats', { token })
}
