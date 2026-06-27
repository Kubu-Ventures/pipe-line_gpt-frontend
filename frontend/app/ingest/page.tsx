'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, RefreshCw, File, CheckCircle, XCircle, Clock, Database } from 'lucide-react'
import { TopNav } from '@/components/TopNav'
import { PageHero } from '@/components/PageHero'
import { Footer } from '@/components/Footer'
import { NextStep } from '@/app/page'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ingestFile, syncPHMSA } from '@/lib/api'

const ACCEPTED = '.pdf,.csv,.zip,.geojson,.tsv,.xlsx'
const MAX_MB = 50

const MOCK_HISTORY = [
  { filename: 'PHMSA_Incident_2023.zip', type: 'PHMSA ZIP', status: 'COMPLETED', chunks: 1842, dedup: null, date: '2026-06-25 14:32' },
  { filename: 'ILI_Report_Segment4B.pdf', type: 'ILI PDF', status: 'COMPLETED', chunks: 214, dedup: '0%', date: '2026-06-24 09:14' },
  { filename: 'SCADA_Export_Q1_2024.csv', type: 'SCADA CSV', status: 'PROCESSING', chunks: null, dedup: null, date: '2026-06-27 08:55' },
  { filename: 'GIS_RightOfWay.geojson', type: 'GeoJSON', status: 'COMPLETED', chunks: 88, dedup: '12%', date: '2026-06-22 16:40' },
  { filename: 'ILI_Report_Segment4B.pdf', type: 'ILI PDF', status: 'COMPLETED', chunks: 0, dedup: '100%', date: '2026-06-21 11:20' },
]

const STATUS_BADGE: Record<string, 'success' | 'blue' | 'danger' | 'gray'> = {
  COMPLETED: 'success',
  PROCESSING: 'blue',
  FAILED: 'danger',
  PENDING: 'gray',
}

export default function IngestPage() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken

  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncDone, setSyncDone] = useState(false)
  const [uploadResults, setUploadResults] = useState<{ name: string; ok: boolean }[]>([])

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
        try { await ingestFile(f, token); return { name: f.name, ok: true } }
        catch { return { name: f.name, ok: false } }
      })
    )
    setUploadResults(results)
    setFiles([])
    setUploading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    try { await syncPHMSA(token); setSyncDone(true) }
    catch { /* surface error in production */ }
    setSyncing(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
      <TopNav activeTab="ingest" />
      <PageHero
        step="Step 1 of 5 · Upload Data"
        title="Data Ingestion"
        subtitle="Upload ILI reports, SCADA exports, PHMSA datasets, and GIS shapefiles"
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content-md" style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Upload section */}
          <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: '6px', padding: '32px', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A1A2A', marginBottom: '6px' }}>Upload Documents</h2>
            <p style={{ fontSize: '0.875rem', color: '#8896A8', marginBottom: '20px' }}>
              Supported formats: PDF, CSV, TSV, ZIP (PHMSA), GeoJSON, XLSX · Max {MAX_MB} MB per file
            </p>

            {/* Drop zone */}
            <label
              style={{
                display: 'block',
                border: dragging ? '2px dashed #005DAA' : '2px dashed #C8D0DC',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? '#E8F0F9' : '#F8F9FB',
                transition: 'all 0.15s',
              }}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input type="file" multiple accept={ACCEPTED} style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
              <Upload size={32} color={dragging ? '#005DAA' : '#C8D0DC'} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: dragging ? '#005DAA' : '#1A1A2A', marginBottom: '4px' }}>
                {dragging ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#8896A8' }}>or <span style={{ color: '#005DAA', fontWeight: 500 }}>browse to select</span></p>
            </label>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8F9FB', border: '1px solid #E4E8EF', borderRadius: '4px' }}>
                    <File size={16} color="#005DAA" />
                    <span style={{ flex: 1, fontSize: '0.875rem', color: '#1A1A2A' }}>{f.name}</span>
                    <span style={{ fontSize: '0.8125rem', color: '#8896A8' }}>{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8896A8', padding: '2px' }}>×</button>
                  </div>
                ))}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    marginTop: '8px',
                    padding: '10px 24px',
                    background: uploading ? '#8896A8' : '#005DAA',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'fit-content',
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
                    {r.ok ? <CheckCircle size={15} color="#1A7A4A" /> : <XCircle size={15} color="#B91C1C" />}
                    <span style={{ color: r.ok ? '#1A7A4A' : '#B91C1C' }}>{r.name}</span>
                    <span style={{ color: '#8896A8' }}>{r.ok ? '· Queued for ingestion' : '· Upload failed'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PHMSA Sync */}
          <div
            className="rosen-card"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E4E8EF',
              borderLeft: '4px solid #005DAA',
              borderRadius: '6px',
              padding: '24px 28px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#E8F0F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={22} color="#005DAA" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A2A', marginBottom: '2px' }}>PHMSA Public Dataset Sync</h3>
                <p style={{ fontSize: '0.875rem', color: '#8896A8' }}>
                  Download the latest PHMSA hazardous liquid and gas pipeline incident files from phmsa.dot.gov.
                </p>
                {syncDone && (
                  <p style={{ fontSize: '0.875rem', color: '#1A7A4A', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={14} /> Sync queued successfully
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing || syncDone}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: syncDone ? '#1A7A4A' : syncing ? '#8896A8' : '#005DAA',
                color: '#FFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: syncing || syncDone ? 'not-allowed' : 'pointer',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={15} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncDone ? 'Synced' : syncing ? 'Syncing…' : 'Sync Latest Data'}
            </button>
          </div>

          {/* History table */}
          <div className="rosen-card" style={{ background: '#FFFFFF', border: '1px solid #E4E8EF', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginTop: 8 }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1A1A2A', marginBottom: '16px', padding: '20px 24px 0' }}>Ingestion History</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Dedup Saved</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_HISTORY.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell style={{ fontWeight: 500, color: '#1A1A2A' }}>{row.filename}</TableCell>
                    <TableCell>
                      <Badge variant="gray">{row.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[row.status] ?? 'gray'}>
                        {row.status === 'PROCESSING' ? <><Clock size={10} style={{ marginRight: '3px' }} />{row.status}</> : row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.chunks ?? '—'}</TableCell>
                    <TableCell style={{ color: row.dedup === '100%' ? '#1A7A4A' : undefined, fontWeight: row.dedup === '100%' ? 600 : undefined }}>
                      {row.dedup ?? '—'}
                    </TableCell>
                    <TableCell style={{ color: '#8896A8', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{row.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <NextStep
        href="/chat"
        label="Ask Questions"
        description="Your data is indexed — now open the AI chat to query it in plain English."
      />
      <Footer />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
