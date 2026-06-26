'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Archive,
  Map,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ingestFile, syncPHMSA, getIngestHistory } from '@/lib/api'
import { formatDate, formatBytes } from '@/lib/utils'

const ACCEPTED_TYPES = ['.pdf', '.csv', '.zip', '.geojson', '.tsv']
const MAX_BYTES = 52_428_800

function fileIcon(name: string) {
  if (name.endsWith('.pdf')) return <FileText className="w-4 h-4 text-[#DC2626]" />
  if (name.endsWith('.csv') || name.endsWith('.tsv')) return <FileSpreadsheet className="w-4 h-4 text-[#16A34A]" />
  if (name.endsWith('.zip')) return <Archive className="w-4 h-4 text-[#D97706]" />
  if (name.endsWith('.geojson')) return <Map className="w-4 h-4 text-[#4AA8FF]" />
  return <FileText className="w-4 h-4 text-[#8B9BB4]" />
}

const statusConfig = {
  COMPLETED: { variant: 'success' as const, icon: CheckCircle2, color: '#16A34A' },
  PROCESSING: { variant: 'warning' as const, icon: Loader2, color: '#D97706' },
  FAILED: { variant: 'danger' as const, icon: AlertCircle, color: '#DC2626' },
  PENDING: { variant: 'default' as const, icon: Clock, color: '#8B9BB4' },
}

export default function IngestPage() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['ingest-history'],
    queryFn: () => getIngestHistory(token),
    enabled: !!token,
    refetchInterval: 10_000,
  })

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return ACCEPTED_TYPES.includes(ext) && f.size <= MAX_BYTES
    })
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...valid.filter((f) => !names.has(f.name))]
    })
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  async function handleUpload() {
    if (!files.length) return
    setUploading(true)
    setUploadProgress(0)
    for (let i = 0; i < files.length; i++) {
      try {
        await ingestFile(files[i], token)
      } catch {
        // individual file error — continue with rest
      }
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
    }
    setFiles([])
    setUploading(false)
    refetchHistory()
  }

  async function handlePHMSASync() {
    setSyncLoading(true)
    setSyncMessage('Downloading latest PHMSA incident dataset…')
    try {
      await syncPHMSA(token)
      setSyncMessage('PHMSA sync job queued. Processing in background.')
      refetchHistory()
    } catch {
      setSyncMessage('Sync failed — check backend connection.')
    } finally {
      setSyncLoading(false)
    }
  }

  const mockHistory = history.length > 0 ? history : [
    { id: 'h1', filename: 'PHMSA_GAS_TRANSMISSION_2023.zip', source_type: 'PHMSA', status: 'COMPLETED' as const, chunk_count: 4821, sha256_hash: 'abc123', ingest_date: new Date(Date.now() - 86400000).toISOString(), operator_id: '31618' },
    { id: 'h2', filename: 'ILI_Report_Segment4B_2023.pdf', source_type: 'PDF', status: 'COMPLETED' as const, chunk_count: 312, sha256_hash: 'def456', ingest_date: new Date(Date.now() - 172800000).toISOString() },
    { id: 'h3', filename: 'SCADA_export_Q3_2023.csv', source_type: 'CSV', status: 'PROCESSING' as const, chunk_count: 0, sha256_hash: 'ghi789', ingest_date: new Date().toISOString() },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Drop zone */}
        <div className="xl:col-span-2 space-y-4">
          <div
            ref={dropZoneRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
              dragOver
                ? 'border-[#1D6FD9] bg-[rgba(29,111,217,0.08)]'
                : 'border-[#1C2E4A] hover:border-[#2A4270] hover:bg-[#0A1628]'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="w-14 h-14 rounded-2xl bg-[#1D6FD9]/10 border border-[#1D6FD9]/20 flex items-center justify-center">
              <Upload className="w-7 h-7 text-[#1D6FD9]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#E8EDF4]">Drop files here or click to browse</p>
              <p className="text-xs text-[#8B9BB4] mt-1">
                Supported: PDF, CSV, TSV, ZIP, GeoJSON · Max {formatBytes(MAX_BYTES)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {ACCEPTED_TYPES.map((ext) => (
                <span key={ext} className="text-xs font-mono px-2 py-0.5 rounded bg-[#0F1E38] border border-[#1C2E4A] text-[#8B9BB4]">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* Staged files */}
          {files.length > 0 && (
            <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl divide-y divide-[#1C2E4A]">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  {fileIcon(f.name)}
                  <span className="text-sm text-[#E8EDF4] flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-[#8B9BB4]">{formatBytes(f.size)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, j) => j !== i)) }}
                    className="p-1 rounded text-[#4A5A72] hover:text-[#DC2626] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#8B9BB4]">
                <span>Uploading & processing…</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {files.length > 0 && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Processing…' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </Button>
          )}
        </div>

        {/* PHMSA Sync */}
        <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1D6FD9]/10 border border-[#1D6FD9]/20 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#1D6FD9]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#E8EDF4]">PHMSA Sync</p>
              <p className="text-xs text-[#8B9BB4]">phmsa.dot.gov</p>
            </div>
          </div>

          <p className="text-xs text-[#8B9BB4] leading-relaxed">
            Downloads the latest PHMSA incident flagged files directly from the official DOT data repository.
            Includes gas transmission, hazardous liquid, and LNG incident records.
          </p>

          <div className="space-y-1.5 text-xs text-[#8B9BB4]">
            <div className="flex justify-between">
              <span>Dataset</span><span className="text-[#E8EDF4]">Incident Flagged Files</span>
            </div>
            <div className="flex justify-between">
              <span>Update frequency</span><span className="text-[#E8EDF4]">Annual</span>
            </div>
            <div className="flex justify-between">
              <span>Coverage</span><span className="text-[#E8EDF4]">2010 – present</span>
            </div>
          </div>

          <Button onClick={handlePHMSASync} disabled={syncLoading} variant="outline" className="w-full mt-auto">
            {syncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncLoading ? 'Syncing…' : 'Sync Latest PHMSA Data'}
          </Button>

          {syncMessage && (
            <p className="text-xs text-[#8B9BB4] text-center leading-relaxed">{syncMessage}</p>
          )}
        </div>
      </div>

      {/* Ingestion history */}
      <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl">
        <div className="px-5 py-4 border-b border-[#1C2E4A] flex items-center justify-between">
          <p className="text-sm font-semibold text-[#E8EDF4]">Ingestion History</p>
          <button onClick={() => refetchHistory()} className="text-xs text-[#8B9BB4] hover:text-[#E8EDF4] flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Ingested</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockHistory.map((item) => {
              const { variant, icon: Icon, color } = statusConfig[item.status]
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {fileIcon(item.filename)}
                      <span className="truncate max-w-[200px]">{item.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="primary" className="text-xs">{item.source_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <Badge variant={variant} className="text-xs">{item.status}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">{item.chunk_count.toLocaleString()}</TableCell>
                  <TableCell className="text-[#8B9BB4] text-xs">{formatDate(item.ingest_date)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
