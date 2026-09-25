'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, File, FolderOpen, CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { getUploadConfig, ingestFile, type UploadConfig } from '@/lib/api'

// Used until the backend's GET /ingest/config answers (or if it predates it).
const FALLBACK_CONFIG: UploadConfig = { max_upload_bytes: 50 * 1024 * 1024, extensions: ['.csv', '.pdf', '.tsv', '.txt', '.zip'] }
const TYPE_LABELS: Record<string, string> = {
  '.pdf': 'PDF', '.csv': 'CSV', '.tsv': 'TSV', '.txt': 'TXT', '.zip': 'ZIP',
}
// Files sent at once: enough to keep the connection busy without flooding the API.
const CONCURRENCY = 3
// Beyond this, suggest the server-side bulk import instead of the browser.
const LARGE_SELECTION_FILES = 300
const LARGE_SELECTION_BYTES = 2 * 1024 ** 3
const BULK_IMPORT_GUIDE = 'https://github.com/Kubu-Ventures/pipe-line_gpt-backend/blob/main/deploy/README.md#importing-an-archive'
const SYSTEM_FILES = new Set(['thumbs.db', 'desktop.ini'])
const LIST_PREVIEW = 8

/** A file to upload; path is its place inside a chosen folder, or just its name. */
interface Picked { file: File; path: string }
interface Skipped { path: string; reason: string }
interface Result { path: string; outcome: 'queued' | 'duplicate' | 'failed'; reason?: string }

function formatSize(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  return `${(bytes / 1024 ** 2).toFixed(bytes >= 10 * 1024 ** 2 ? 0 : 1)} MB`
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

/** Files and folders dropped on the page, folders walked recursively. */
async function pickedFromDrop(dataTransfer: DataTransfer): Promise<Picked[]> {
  // Entries must be taken before the first await: the DataTransfer is emptied after the event.
  const entries = Array.from(dataTransfer.items)
    .map(item => item.webkitGetAsEntry?.())
    .filter((entry): entry is FileSystemEntry => !!entry)
  if (entries.length === 0) return Array.from(dataTransfer.files).map(file => ({ file, path: file.name }))

  const picked: Picked[] = []
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject))
      picked.push({ file, path: entry.fullPath.replace(/^\//, '') })
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader()
      // readEntries returns the folder in batches (about 100 at a time): read until empty.
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
        if (batch.length === 0) break
        for (const child of batch) await walk(child)
      }
    }
  }
  for (const entry of entries) await walk(entry)
  return picked
}

export function UploadPanel({ token, onQueued }: { token?: string; onQueued: () => void }) {
  const [config, setConfig] = useState<UploadConfig>(FALLBACK_CONFIG)
  const [files, setFiles] = useState<Picked[]>([])
  const [skipped, setSkipped] = useState<Skipped[]>([])
  const [ignoredCount, setIgnoredCount] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [total, setTotal] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const cancelled = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!token) return
    getUploadConfig(token).then(setConfig).catch(() => setConfig(FALLBACK_CONFIG))
  }, [token])

  const maxMb = Math.round(config.max_upload_bytes / 1024 ** 2)
  const typeList = config.extensions.map(ext => TYPE_LABELS[ext] ?? ext.slice(1).toUpperCase()).join(', ')

  /** Keep what the backend accepts; say why anything else is left out. */
  function add(incoming: Picked[]) {
    const accepted: Picked[] = []
    const rejected: Skipped[] = []
    let ignored = 0
    const known = new Set(files.map(f => f.path))
    for (const item of incoming) {
      const name = item.path.split('/').pop() ?? item.path
      if (name.startsWith('.') || SYSTEM_FILES.has(name.toLowerCase())) { ignored++; continue }
      if (known.has(item.path)) continue
      const ext = extensionOf(name)
      if (!config.extensions.includes(ext)) rejected.push({ path: item.path, reason: `unsupported type${ext ? ` (${ext})` : ''}` })
      else if (item.file.size === 0) rejected.push({ path: item.path, reason: 'empty file' })
      else if (item.file.size > config.max_upload_bytes) rejected.push({ path: item.path, reason: `larger than ${maxMb} MB (${formatSize(item.file.size)})` })
      else { accepted.push(item); known.add(item.path) }
    }
    setFiles(prev => [...prev, ...accepted])
    setSkipped(prev => [...prev, ...rejected])
    setIgnoredCount(prev => prev + ignored)
    setResults([])
  }

  function fromInput(list: FileList | null) {
    if (!list) return
    // webkitRelativePath is set when a folder was chosen ("records/2009/report.pdf").
    add(Array.from(list).map(file => ({ file, path: file.webkitRelativePath || file.name })))
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    setReading(true)
    try {
      add(await pickedFromDrop(e.dataTransfer))
    } finally {
      setReading(false)
    }
  }

  function clearSelection() {
    setFiles([])
    setSkipped([])
    setIgnoredCount(0)
    setShowAll(false)
  }

  async function upload() {
    if (!files.length || uploading) return
    const queue = [...files]
    const done: Result[] = []
    let next = 0
    let notified = false
    cancelled.current = false
    setUploading(true)
    setTotal(queue.length)
    setResults([])
    setSkipped([])
    setIgnoredCount(0)

    const worker = async () => {
      while (!cancelled.current && next < queue.length) {
        const item = queue[next++]
        try {
          // Only folder files carry a path; a single file's name is enough.
          const res = await ingestFile(item.file, token, item.path.includes('/') ? item.path : undefined)
          done.push({ path: item.path, outcome: res.task_id === 'dedup-skip' ? 'duplicate' : 'queued' })
          if (!notified) { notified = true; onQueued() }  // let the list below start following progress
        } catch (err) {
          done.push({ path: item.path, outcome: 'failed', reason: err instanceof Error ? err.message : 'Upload failed' })
        }
        setResults([...done])
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))

    // After a cancel, keep what wasn't sent so it can be resumed.
    const sent = new Set(done.map(r => r.path))
    setFiles(queue.filter(item => !sent.has(item.path)))
    setUploading(false)
    onQueued()
  }

  const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0)
  const largeSelection = files.length >= LARGE_SELECTION_FILES || totalBytes >= LARGE_SELECTION_BYTES
  const counts = { queued: 0, duplicate: 0, failed: 0 }
  for (const r of results) counts[r.outcome]++
  const failures = results.filter(r => r.outcome === 'failed')
  const shownFiles = showAll ? files : files.slice(0, LIST_PREVIEW)

  const button = (primary: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 4, fontSize: '0.875rem', fontWeight: 600,
    cursor: 'pointer', border: primary ? 'none' : '1px solid #C8D0DC', background: primary ? '#006eb5' : '#FFFFFF', color: primary ? '#FFFFFF' : '#232e3e',
  })

  return (
    <div className="brand-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: '6px', padding: '32px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#232e3e', marginBottom: '6px' }}>Upload Documents</h2>
      <p style={{ fontSize: '0.875rem', color: '#8896A8', marginBottom: 6 }}>
        Supported formats: {typeList} · Max {maxMb} MB per file · Files or whole folders
      </p>
      <p style={{ fontSize: '0.8125rem', color: '#55606e', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Loading years of records? A folder of a few hundred files can be uploaded here. For a whole archive, your
          administrator can import it on the server in one step, with no browser involved.{' '}
          <a href={BULK_IMPORT_GUIDE} target="_blank" rel="noopener noreferrer" style={{ color: '#006eb5', fontWeight: 500 }}>How bulk import works</a>
        </span>
      </p>

      {/* Drop zone */}
      <div
        style={{
          border: dragging ? '2px dashed #006eb5' : '2px dashed #C8D0DC', borderRadius: '8px', padding: '36px 24px',
          textAlign: 'center', background: dragging ? '#dff0ff' : '#F8F9FB', transition: 'all 0.15s',
        }}
        onDragOver={e => { e.preventDefault(); if (!uploading) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { if (uploading) { e.preventDefault(); return } onDrop(e) }}
      >
        <Upload size={32} color={dragging ? '#006eb5' : '#C8D0DC'} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: dragging ? '#006eb5' : '#232e3e', marginBottom: 12 }}>
          {reading ? 'Reading folder…' : dragging ? 'Drop files or folders here' : 'Drag & drop files or folders here'}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" style={button(false)} disabled={uploading} onClick={() => fileInput.current?.click()}>
            <File size={14} /> Select files
          </button>
          <button type="button" style={button(false)} disabled={uploading} onClick={() => folderInput.current?.click()}>
            <FolderOpen size={14} /> Select folder
          </button>
        </div>
        <input ref={fileInput} type="file" multiple accept={config.extensions.join(',')} style={{ display: 'none' }}
          onChange={e => { fromInput(e.target.files); e.target.value = '' }} />
        {/* webkitdirectory isn't in React's types; every current browser supports it. */}
        <input ref={el => { folderInput.current = el; el?.setAttribute('webkitdirectory', '') }} type="file" multiple
          style={{ display: 'none' }} onChange={e => { fromInput(e.target.files); e.target.value = '' }} />
      </div>

      {/* Files left out, with the reason */}
      {(skipped.length > 0 || ignoredCount > 0) && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 4, fontSize: '0.8125rem', color: '#92400E' }}>
          {skipped.length > 0 && (
            <>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>{skipped.length} file{skipped.length !== 1 ? 's' : ''} left out:</p>
              {skipped.slice(0, 10).map(s => (
                <p key={s.path} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.path}>
                  {s.path} — {s.reason}
                </p>
              ))}
              {skipped.length > 10 && <p>and {skipped.length - 10} more</p>}
            </>
          )}
          {ignoredCount > 0 && <p style={{ marginTop: skipped.length ? 4 : 0 }}>{ignoredCount} hidden or system file{ignoredCount !== 1 ? 's' : ''} ignored.</p>}
        </div>
      )}

      {/* Selected files */}
      {files.length > 0 && !uploading && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: '#232e3e' }}>
            <strong>{files.length.toLocaleString()} file{files.length !== 1 ? 's' : ''} ready · {formatSize(totalBytes)}</strong>
            <button type="button" onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#8896A8', cursor: 'pointer', fontSize: '0.8125rem' }}>Clear</button>
          </div>
          {shownFiles.map(item => (
            <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#F8F9FB', border: '1px solid #E4E8EF', borderRadius: 4 }}>
              <File size={15} color="#006eb5" style={{ flexShrink: 0 }} />
              <span title={item.path} style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', color: '#232e3e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.path}</span>
              <span style={{ fontSize: '0.8125rem', color: '#8896A8', flexShrink: 0 }}>{formatSize(item.file.size)}</span>
              <button type="button" aria-label={`Remove ${item.path}`} onClick={() => setFiles(prev => prev.filter(f => f.path !== item.path))}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8896A8', padding: 2, display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          ))}
          {files.length > LIST_PREVIEW && (
            <button type="button" onClick={() => setShowAll(v => !v)} style={{ background: 'none', border: 'none', color: '#006eb5', cursor: 'pointer', fontSize: '0.8125rem', textAlign: 'left', padding: 0 }}>
              {showAll ? 'Show fewer' : `Show all ${files.length.toLocaleString()} files`}
            </button>
          )}
          {largeSelection && (
            <p style={{ fontSize: '0.8125rem', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                That&apos;s a large selection. It will upload, but keep this page open until it finishes; for whole archives the{' '}
                <a href={BULK_IMPORT_GUIDE} target="_blank" rel="noopener noreferrer" style={{ color: '#92400E', fontWeight: 600 }}>server-side bulk import</a>{' '}
                is faster and can be resumed.
              </span>
            </p>
          )}
          <button type="button" onClick={upload} style={{ ...button(true), marginTop: 4, width: 'fit-content', padding: '10px 24px', fontSize: '0.9375rem' }}>
            <Upload size={15} /> Upload {files.length.toLocaleString()} file{files.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Progress and results */}
      {(uploading || results.length > 0) && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {uploading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: '#232e3e' }}>
                <strong>Uploading {results.length.toLocaleString()} / {total.toLocaleString()}…</strong>
                <button type="button" onClick={() => { cancelled.current = true }} style={button(false)}>Stop</button>
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={results.length}
                style={{ height: 6, background: '#E4E8EF', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${total ? (results.length / total) * 100 : 0}%`, background: '#006eb5', transition: 'width 0.2s' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#8896A8' }}>Keep this page open until the upload finishes.</p>
            </>
          )}
          {results.length > 0 && (
            <p style={{ fontSize: '0.875rem', color: '#232e3e', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#1A7A4A' }}><CheckCircle size={14} /> {counts.queued.toLocaleString()} queued</span>
              {counts.duplicate > 0 && <span style={{ color: '#55606e' }}>{counts.duplicate.toLocaleString()} already indexed</span>}
              {counts.failed > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#B91C1C' }}><XCircle size={14} /> {counts.failed.toLocaleString()} failed</span>}
            </p>
          )}
          {failures.map(f => (
            <p key={f.path} title={f.path} style={{ fontSize: '0.8125rem', color: '#B91C1C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.path} — {f.reason}
            </p>
          ))}
          {!uploading && files.length > 0 && (
            <p style={{ fontSize: '0.8125rem', color: '#55606e' }}>Stopped: {files.length.toLocaleString()} file{files.length !== 1 ? 's were' : ' was'} not sent and {files.length !== 1 ? 'are' : 'is'} still listed above.</p>
          )}
          {!uploading && counts.queued > 0 && (
            <p style={{ fontSize: '0.8125rem', color: '#8896A8', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Info size={12} /> Processing takes 10–60 seconds per file; scanned PDFs are read with OCR and take a few seconds per page. The list below updates automatically.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
