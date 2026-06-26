'use client'

import { X, FileText, Calendar, MapPin, User } from 'lucide-react'
import type { Citation } from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface CitationPanelProps {
  citation: Citation | null
  onClose: () => void
}

export function CitationPanel({ citation, onClose }: CitationPanelProps) {
  if (!citation) return null

  return (
    <div className="w-[400px] shrink-0 border-l border-[#1C2E4A] bg-[#0A1628] flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#1C2E4A] gap-3">
        <FileText className="w-4 h-4 text-[#1D6FD9]" />
        <span className="text-sm font-medium text-[#E8EDF4] flex-1 truncate">Source Document</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#4A5A72] hover:text-[#E8EDF4] hover:bg-[#0F1E38] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Document metadata */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">Document</p>
          <div className="bg-[#0F1E38] border border-[#1C2E4A] rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-[#E8EDF4] break-all">{citation.filename}</p>
            <div className="flex flex-wrap gap-2 text-xs text-[#8B9BB4]">
              {citation.page_ref && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {citation.page_ref}
                </span>
              )}
              {citation.ingest_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(citation.ingest_date)}
                </span>
              )}
              {citation.segment_id && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Segment {citation.segment_id}
                </span>
              )}
              {citation.operator_id && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Op. {citation.operator_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Source ID badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">Reference</span>
          <span className="font-mono text-xs text-[#4AA8FF] bg-[rgba(29,111,217,0.10)] border border-[#1D6FD9]/20 px-2 py-0.5 rounded">
            [{citation.source_id}]
          </span>
          {citation.section_label && (
            <span className="text-xs text-[#8B9BB4]">· {citation.section_label}</span>
          )}
        </div>

        {/* Chunk text */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">Relevant Passage</p>
          <div className="bg-[#050D1A] border border-[#1C2E4A] rounded-lg p-4">
            <p className="text-sm text-[#E8EDF4] leading-relaxed whitespace-pre-wrap">
              {citation.text_content}
            </p>
          </div>
        </div>

        {/* Chunk index */}
        <p className="text-xs text-[#4A5A72] font-mono">
          chunk_index: {citation.chunk_index}
        </p>
      </div>
    </div>
  )
}
