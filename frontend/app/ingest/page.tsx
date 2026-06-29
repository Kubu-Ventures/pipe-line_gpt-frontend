'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, RefreshCw, File, CheckCircle, XCircle, Clock, Database, AlertCircle, Info, Trash2 } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/components/NextStep'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ingestFile, syncPHMSA, getIngestHistory, deleteDocument } from '@/lib/api'

const ACCEPTED = '.pdf,.csv,.zip,.geojson,.tsv,.xlsx'
const MAX_MB = 50

const STATUS_BADGE: Record<string, 'success' | 'blue' | 'danger' | 'gray'> = {
  COMPLETED: 'success',
  PROCESSING: 'blue',
  FAILED: 'danger',
  PENDING: 'gray',
}

const SOURCE_LABEL: Record<string, string> = {
  pdf: 'ILI PDF',
  csv: 'SCADA CSV',
  phmsa: 'PHMSA TSV',
  phmsa_zip: 'PHMSA ZIP',
  geojson: 'GeoJSON',
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

export default function IngestPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken
  const userRole = ((session as any)?.user?.role as string | undefined) ?? ''
  const canDelete = userRole === 'ENGINEER' || userRole === 'ADMIN'

  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{ name: string; ok: boolean; dedup?: boolean }[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [syncing, setSyncing] = useState(false)
  const [syncState, setSyncState] = useState<'idle' | 'downloading' | 'queued' | 'already_loaded' | 'error'>('idle')
  const [syncQueued, setSyncQueued] = useState(0)

  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!token) return
    try {
      const data = await getIngestHistory(token)
      setHistory(data)
      setHistoryError(false)
    } catch {
      setHistoryError(true)
    } finally {
      setHistoryLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => { loadHistory() }, [loadHistory])

  // Poll every 5s while any document is PENDING or PROCESSING
  useEffect(() => {
    const hasActive = history.some(d => d.status === 'PENDING' || d.status === 'PROCESSING')
    if (!hasActive) return
    const id = setTimeout(() => loadHistory(), 5000)
    return () => clearTimeout(id)
  }, [history, loadHistory])

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => f.size <= MAX_MB * 1024 * 1024)
    setFiles(prev => [...prev, ...valid])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const handleUpload = async () => {
    if (!files.length) return
    setUploading(true)
    const results = await Promise.all(
      files.map(async f => {
        try {
          const res = await ingestFile(f, token)
          return { name: f.name, ok: true, dedup: res.task_id === 'dedup-skip' }
        } catch {
          return { name: f.name, ok: false }
        }
      })
    )
    setUploadResults(results)
    setFiles([])
    setUploading(false)
    setTimeout(() => loadHistory(), 1500)
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncState('downloading')
    try {
      const res = await syncPHMSA(token)
      setSyncQueued(res.queued ?? 0)
      setSyncState(res.queued > 0 ? 'queued' : 'already_loaded')
    } catch {
      setSyncState('error')
    } finally {
      setSyncing(false)
      setTimeout(() => loadHistory(), 2000)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteConfirm(null)
    setDeleting(id)
    try {
      await deleteDocument(id, token)
      await loadHistory()
    } catch {
      // non-blocking; history reload will show current state
    } finally {
      setDeleting(null)
    }
  }

  const hasActive = history.some((d: any) => d.status === 'PENDING' || d.status === 'PROCESSING')
  const totalChunks = history.reduce((sum: number, d: any) => sum + (d.chunk_count ?? 0), 0)
  const indexedCount = history.filter((d: any) => d.status === 'COMPLETED').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0' }}>
      <TopNav activeTab="ingest" />
      <PageHero
        step="Step 1 of 5 · Upload Data"
        title="Data Ingestion"
        subtitle="Upload ILI reports, SCADA exports, PHMSA datasets, and GIS shapefiles"
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content-md" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px' }}>

          {/* Upload section */}
          <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: '6px', padding: '32px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#232e3e', marginBottom: '6px' }}>Upload Documents</h2>
            <p style={{ fontSize: '0.875rem', color: '#8896A8', marginBottom: '20px' }}>
              Supported formats: PDF, CSV, TSV, ZIP (PHMSA), GeoJSON · Max {MAX_MB} MB per file
            </p>

            {/* Drop zone */}
            <label
              style={{
                display: 'block',
                border: dragging ? '2px dashed #006eb5' : '2px dashed #C8D0DC',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#dff0ff' : '#F8F9FB',
                transition: 'all 0.15s',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input type="file" multiple accept={ACCEPTED} style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
              <Upload size={32} color={dragging ? '#006eb5' : '#C8D0DC'} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: dragging ? '#006eb5' : '#232e3e', marginBottom: '4px' }}>
                {dragging ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#8896A8' }}>or <span style={{ color: '#006eb5', fontWeight: 500 }}>browse to select</span></p>
            </label>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8F9FB', border: '1px solid #E4E8EF', borderRadius: '4px' }}>
                    <File size={16} color="#006eb5" />
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#232e3e' }}>{f.name}</span>
                    <span style={{ fontSize: '0.8125rem', color: '#8896A8' }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8896A8', padding: '2px' }}>×</button>
                  </div>
                ))}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    marginTop: '8px', padding: '10px 24px',
                    background: uploading ? '#8896A8' : '#006eb5',
                    color: '#FFF', border: 'none', borderRadius: '4px',
                    fontSize: '0.9375rem', fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content',
                  }}
                >
                  <Upload size={15} />
                  {uploading ? 'Uploading…' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {/* Upload results */}
            {uploadResults.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {uploadResults.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                    {r.ok
                      ? <CheckCircle size={15} color="#1A7A4A" />
                      : <XCircle size={15} color="#B91C1C" />
                    }
                    <span style={{ color: r.ok ? '#1A7A4A' : '#B91C1C', fontWeight: 500 }}>{r.name}</span>
                    <span style={{ color: '#8896A8' }}>
                      {!r.ok ? '— Upload failed' : r.dedup ? '— Already indexed (duplicate skipped)' : '— Queued for processing'}
                    </span>
                  </div>
                ))}
                <p style={{ fontSize: '0.8125rem', color: '#8896A8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Info size={12} /> Processing takes 10–60 seconds depending on file size. The Ingestion History below updates automatically.
                </p>
              </div>
            )}
          </div>

          {/* PHMSA Sync */}
          <div
            className="rosen-card"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4E8EF',
              borderLeft: '4px solid #006eb5',
              borderRadius: '6px',
              padding: '24px 28px',
              marginBottom: '32px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                <div style={{ width: '48px', height: '48px', background: '#dff0ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Database size={22} color="#006eb5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#232e3e', marginBottom: '4px' }}>Load Demo Dataset</h3>
                  <p style={{ fontSize: '0.875rem', color: '#8896A8', marginBottom: 8 }}>
                    Loads 4 realistic sample pipeline files — ILI inspection report, SCADA export, PHMSA-format incident records, and integrity management schedule.
                  </p>

                  {/* What happens explanation */}
                  {syncState === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        '1. Generates 4 sample files: ILI report, SCADA data, incident records, IMP schedule',
                        '2. Chunks and embeds each file into the knowledge base',
                        '3. Appears in Ingestion History below once complete (~30–60 seconds)',
                        '4. You can then ask questions about the data in the AI Chat',
                      ].map((step, i) => (
                        <p key={i} style={{ fontSize: '0.8125rem', color: '#55606e', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#006eb5', fontWeight: 700, fontSize: 10 }}>›</span> {step}
                        </p>
                      ))}
                    </div>
                  )}

                  {syncState === 'downloading' && (
                    <p style={{ fontSize: '0.875rem', color: '#006eb5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      Preparing demo datasets and queuing for processing…
                    </p>
                  )}

                  {syncState === 'queued' && (
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#1A7A4A', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <CheckCircle size={14} />
                        {syncQueued} file{syncQueued !== 1 ? 's' : ''} queued — watch the Ingestion History below, status updates automatically every 5 seconds.
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#8896A8' }}>
                        The page refreshes automatically while processing.
                      </p>
                    </div>
                  )}

                  {syncState === 'already_loaded' && (
                    <p style={{ fontSize: '0.875rem', color: '#006eb5', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} />
                      Demo data is already in the knowledge base — no new files to add. You can go straight to the AI Chat.
                    </p>
                  )}

                  {syncState === 'error' && (
                    <p style={{ fontSize: '0.875rem', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertCircle size={14} />
                      Something went wrong loading the demo data. Check that the backend is running and try again.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSync}
                disabled={syncing || syncState === 'queued' || syncState === 'already_loaded'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px',
                  background: syncState === 'queued' || syncState === 'already_loaded' ? '#1A7A4A' : syncState === 'error' ? '#B91C1C' : syncing ? '#8896A8' : '#006eb5',
                  color: '#FFF', border: 'none', borderRadius: '4px',
                  fontSize: '0.875rem', fontWeight: 600,
                  cursor: syncing || syncState === 'queued' || syncState === 'already_loaded' ? 'not-allowed' : 'pointer',
                  flexShrink: 0, alignSelf: 'flex-start',
                }}
              >
                <RefreshCw size={15} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncState === 'queued' ? 'Loaded' : syncState === 'already_loaded' ? 'Already Loaded' : syncing ? 'Loading…' : syncState === 'error' ? 'Retry' : 'Load Demo Data'}
              </button>
            </div>
          </div>

          {/* Knowledge base summary strip */}
          {history.length > 0 && (
            <div style={{ display: 'flex', gap: 0, background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: 6, overflow: 'hidden', marginTop: 8, marginBottom: 8 }}>
              {[
                { value: indexedCount, label: 'Documents indexed', color: '#1A7A4A' },
                { value: totalChunks.toLocaleString(), label: 'Total chunks in knowledge base', color: '#006eb5' },
                { value: history.filter((d: any) => d.status === 'FAILED').length, label: 'Failed', color: '#991B1B' },
              ].map((m, i) => (
                <div key={m.label} style={{ flex: 1, padding: '14px 20px', borderLeft: i > 0 ? '1px solid #E4E8EF' : 'none' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: '#8896A8', marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* History table */}
          <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#232e3e', marginBottom: 2 }}>Knowledge Base</h2>
                {canDelete && (
                  <p style={{ fontSize: '0.8125rem', color: '#8896A8', marginTop: 2 }}>
                    Engineers and admins can remove documents from the knowledge base.
                  </p>
                )}
                {hasActive && (
                  <p style={{ fontSize: '0.8125rem', color: '#006eb5', display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                    <RefreshCw size={11} style={{ animation: 'spin 2s linear infinite' }} /> Refreshing automatically while processing…
                  </p>
                )}
              </div>
              <button
                onClick={loadHistory}
                style={{ background: 'none', border: '1px solid #E4E8EF', padding: '5px 10px', cursor: 'pointer', borderRadius: 4, fontSize: '0.8125rem', color: '#55606e', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#8896A8', fontSize: '0.9rem' }}>
                <Clock size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                Loading ingestion history…
              </div>
            ) : historyError ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#B91C1C', fontSize: '0.9rem' }}>
                <AlertCircle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
                Could not load history. Is the backend running?
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#8896A8' }}>
                <Database size={28} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, marginBottom: 4 }}>No documents ingested yet</p>
                <p style={{ fontSize: '0.875rem' }}>Upload a file above or click "Sync Latest Data" to get started.</p>
              </div>
            ) : (
              <div style={{ marginTop: 16 }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Chunks</TableHead>
                      <TableHead>Uploaded by</TableHead>
                      <TableHead>Indexed</TableHead>
                      {canDelete && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((row) => (
                      <TableRow key={row.id} style={{ opacity: deleting === row.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                        <TableCell style={{ fontWeight: 500, color: '#232e3e', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.filename}
                        </TableCell>
                        <TableCell>
                          <Badge variant="gray">{SOURCE_LABEL[row.source_type] ?? row.source_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[row.status] ?? 'gray'}>
                            {(row.status === 'PROCESSING' || row.status === 'PENDING')
                              ? <><RefreshCw size={10} style={{ marginRight: '3px', animation: 'spin 1.5s linear infinite' }} />{row.status}</>
                              : row.status === 'COMPLETED'
                              ? <><CheckCircle size={10} style={{ marginRight: '3px' }} />INDEXED</>
                              : row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.chunk_count > 0 ? row.chunk_count.toLocaleString() : '—'}</TableCell>
                        <TableCell style={{ color: '#55606e', fontSize: '0.8125rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={row.uploaded_by ?? undefined}>
                          {row.uploaded_by ? row.uploaded_by.split('@')[0] : '—'}
                        </TableCell>
                        <TableCell style={{ color: '#8896A8', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {formatDate(row.ingest_date)}
                        </TableCell>
                        {canDelete && (
                          <TableCell>
                            <button
                              onClick={() => setDeleteConfirm({ id: row.id, name: row.filename })}
                              disabled={!!deleting}
                              title="Remove from knowledge base"
                              style={{
                                background: 'none', border: '1px solid #FECACA', borderRadius: 4,
                                padding: '4px 8px', cursor: deleting ? 'not-allowed' : 'pointer',
                                color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontSize: '0.75rem', fontWeight: 600,
                              }}
                              onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#FEE2E2' }}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                              <Trash2 size={11} />
                              {deleting === row.id ? 'Removing…' : 'Remove'}
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>

      <NextStep
        href="/chat"
        label="Ask Questions"
        description="Your data is indexed — now open the AI chat to query it in any language."
      />
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(35,46,62,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 8, padding: '28px 32px', maxWidth: 440, width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} color="#B91C1C" />
              </div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#232e3e', marginBottom: 2 }}>Remove from knowledge base?</p>
                <p style={{ fontSize: '0.8125rem', color: '#8896A8' }}>This action cannot be undone.</p>
              </div>
            </div>
            <div style={{ background: '#F8F9FB', border: '1px solid #E4E8EF', borderRadius: 4, padding: '10px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#232e3e', marginBottom: 4 }}>{deleteConfirm.name}</p>
              <p style={{ fontSize: '0.8125rem', color: '#8896A8', lineHeight: 1.5 }}>
                All chunks and embeddings for this document will be permanently deleted. Any AI responses that cited this document will remain in the history, but future queries will no longer retrieve content from it.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: '8px 18px', border: '1px solid #E4E8EF', borderRadius: 4, background: '#fff', fontSize: '0.875rem', fontWeight: 600, color: '#55606e', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{ padding: '8px 18px', border: 'none', borderRadius: 4, background: '#B91C1C', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={13} /> Yes, remove it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
