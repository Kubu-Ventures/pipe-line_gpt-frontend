export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Types ──────────────────────────────────────────────────────────────────

export interface QueryFilters {
  pipeline_segment?: string
  date_range?: { from: string; to: string }
  commodity?: string
}

export interface QueryRequest {
  question: string
  language?: string
  session_id: string
  filters?: QueryFilters
}

export interface Citation {
  source_id: string
  document_id: string
  filename: string
  chunk_index: number
  text_content: string
  page_ref?: string
  section_label?: string
  segment_id?: string
  operator_id?: string
  ingest_date?: string
}

export interface ReviewItem {
  id: string
  query_id: string
  response_id: string
  question: string
  answer_text: string
  citations: Citation[]
  confidence_score: number
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW'
  submitted_by: string
  submitted_at: string
  decision?: 'APPROVE' | 'EDIT' | 'REJECT'
  reason?: string
}

export interface DecisionPayload {
  decision: 'APPROVE' | 'EDIT' | 'REJECT'
  final_text?: string
  reason?: string
}

export interface AuditEvent {
  id: string
  event_type: string
  actor_id: string
  target_id: string
  target_type: string
  payload_json: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface AuditPage {
  items: AuditEvent[]
  total: number
  page: number
  page_size: number
}

export interface AuditParams {
  event_type?: string
  actor?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface DashboardStats {
  total_queries: number
  total_queries_trend: number
  hitl_pending: number
  avg_confidence: number
  documents_ingested: number
  queries_by_day: { date: string; count: number }[]
  incidents_by_year: { year: number; count: number }[]
  recent_events: AuditEvent[]
}

export interface IngestHistoryItem {
  id: string
  filename: string
  source_type: string
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING'
  chunk_count: number
  sha256_hash: string
  ingest_date: string
  operator_id?: string
  segment_id?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
): Promise<{ access_token: string; token_type: string }> {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

// ── Query (SSE) ────────────────────────────────────────────────────────────

export function postQueryStream(body: QueryRequest, token: string): Promise<Response> {
  return fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  })
}

// ── Ingest ────────────────────────────────────────────────────────────────

export async function ingestFile(
  file: File,
  token: string,
): Promise<{ task_id: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  })
  if (!res.ok) throw new Error(`Ingest failed: ${res.status}`)
  return res.json()
}

export async function syncPHMSA(token: string): Promise<{ task_id: string }> {
  return apiFetch('/ingest/phmsa-sync', { method: 'POST' }, token)
}

export async function getIngestHistory(token: string): Promise<IngestHistoryItem[]> {
  return apiFetch('/ingest/history', {}, token)
}

// ── Review ────────────────────────────────────────────────────────────────

export async function getReviewQueue(
  status: string | undefined,
  token: string,
): Promise<ReviewItem[]> {
  const qs = status ? `?status=${status}` : ''
  return apiFetch(`/review${qs}`, {}, token)
}

export async function submitDecision(
  queryId: string,
  payload: DecisionPayload,
  token: string,
): Promise<void> {
  await apiFetch(`/review/${queryId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token)
}

// ── Audit ─────────────────────────────────────────────────────────────────

export async function getAuditLog(
  params: AuditParams,
  token: string,
): Promise<AuditPage> {
  const qs = new URLSearchParams()
  if (params.event_type) qs.set('event_type', params.event_type)
  if (params.actor) qs.set('actor', params.actor)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  qs.set('page', String(params.page ?? 1))
  qs.set('page_size', String(params.page_size ?? 50))
  return apiFetch(`/audit?${qs.toString()}`, {}, token)
}

export function auditExportUrl(token: string): string {
  return `${API_BASE}/audit/export?token=${token}`
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  return apiFetch('/health/stats', {}, token)
}
