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
  excerpt: string
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
  decision?: string | null
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

export interface QueryHistoryItem {
  query_id: string
  question: string
  asked_at: string
  status: 'PENDING' | 'PROCESSING' | 'UNDER_REVIEW' | 'DELIVERED' | 'REJECTED'
  hitl_required: boolean
  answer_text: string
  final_text: string | null
  decision: 'APPROVE' | 'EDIT' | 'REJECT' | null
  reason: string | null
  reviewed_at: string | null
  citations: Citation[]
  confidence_score: number
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
export interface UploadConfig {
  max_upload_bytes: number
  /** e.g. [".csv", ".pdf", ".tsv", ".txt", ".zip"] */
  extensions: string[]
}

export async function getUploadConfig(token?: string): Promise<UploadConfig> {
  return apiFetch('/ingest/config', { token })
}

/**
 * Upload one document. relativePath is the file's path inside an uploaded folder
 * ("records/2009/ILI/report.pdf"); the backend keeps it as the document's name.
 * Errors carry the backend's reason (e.g. "File exceeds 50 MB limit.").
 */
export async function ingestFile(
  file: File,
  token?: string,
  relativePath?: string,
): Promise<{ task_id: string; document_id: string; filename: string; message: string }> {
  const form = new FormData()
  form.append('file', file)
  if (relativePath) form.append('relative_path', relativePath)
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: { Authorization: token ? `Bearer ${token}` : '' },
    body: form,
  })
  if (!res.ok) {
    let reason = `Upload failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body?.detail === 'string') reason = body.detail
    } catch {
      // not JSON: keep the status
    }
    throw new Error(reason)
  }
  return res.json()
}

export async function syncPHMSA(token?: string): Promise<{ task_ids: string[]; queued: number }> {
  return apiFetch('/ingest/phmsa-sync', { method: 'POST', token })
}

export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface DocumentItem {
  id: string
  /** Bulk-imported documents carry their folder path, e.g. "2009/ILI/report.pdf". */
  filename: string
  source_type: string
  status: DocumentStatus
  chunk_count: number
  ingest_date: string | null
  segment_id: string | null
  commodity: string | null
  uploaded_by: string | null
}

export interface DocumentPage {
  items: DocumentItem[]
  /** Documents matching the filters. */
  total: number
  limit: number
  offset: number
  /** Totals for the whole knowledge base, whatever the filters. */
  summary: { documents: number; by_status: Record<DocumentStatus, number>; total_chunks: number }
}

export async function listDocuments(
  params: { limit?: number; offset?: number; q?: string; status?: DocumentStatus },
  token?: string
): Promise<DocumentPage> {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return apiFetch(`/ingest/documents?${search}`, { token })
}

export async function deleteDocument(
  documentId: string,
  token?: string
): Promise<{ deleted: boolean; document_id: string; filename: string; chunks_removed: number }> {
  return apiFetch(`/ingest/${documentId}`, { method: 'DELETE', token })
}

export async function getChunkText(
  documentId: string,
  chunkIndex: number,
  token?: string
): Promise<{ text_content: string; section_label: string | null; page_ref: string | null }> {
  return apiFetch(`/ingest/chunk/${documentId}/${chunkIndex}`, { token })
}

// Query history
export async function getQueryHistory(token?: string, limit = 50): Promise<QueryHistoryItem[]> {
  return apiFetch<QueryHistoryItem[]>(`/query/history?limit=${limit}`, { token })
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
