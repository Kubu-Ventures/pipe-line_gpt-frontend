'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { Download, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuditLog, auditExportUrl } from '@/lib/api'
import { formatDate, truncate } from '@/lib/utils'

const EVENT_TYPES = [
  'ALL',
  'QUERY_COMPLETED',
  'HITL_APPROVED',
  'HITL_REJECTED',
  'HITL_EDITED',
  'INGEST_COMPLETED',
  'INGEST_STARTED',
  'LOGIN',
  'PHMSA_SYNC',
]

const eventBadgeVariant: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'default'> = {
  QUERY_COMPLETED: 'primary',
  HITL_APPROVED: 'success',
  HITL_REJECTED: 'danger',
  HITL_EDITED: 'warning',
  INGEST_COMPLETED: 'success',
  INGEST_STARTED: 'default',
  LOGIN: 'default',
  PHMSA_SYNC: 'primary',
}

const MOCK_EVENTS = [
  { id: 'ae-001', event_type: 'QUERY_COMPLETED', actor_id: 'operator@pipeline.com', target_id: 'q-4a2f', target_type: 'query', payload_json: { risk_level: 'LOW', confidence: 0.92, hitl_required: false }, ip_address: '10.0.0.12', created_at: new Date().toISOString() },
  { id: 'ae-002', event_type: 'HITL_APPROVED', actor_id: 'engineer@pipeline.com', target_id: 'r-9b7c', target_type: 'review', payload_json: { decision: 'APPROVE', original_response_id: 'resp-xyz' }, ip_address: '10.0.0.14', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'ae-003', event_type: 'HITL_REJECTED', actor_id: 'engineer@pipeline.com', target_id: 'r-5d1e', target_type: 'review', payload_json: { decision: 'REJECT', reason: 'Incorrect pressure recommendation for HCA segment' }, ip_address: '10.0.0.14', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'ae-004', event_type: 'INGEST_COMPLETED', actor_id: 'admin@pipeline.com', target_id: 'd-f3a9', target_type: 'document', payload_json: { filename: 'PHMSA_GAS_TRANSMISSION_2023.zip', chunk_count: 4821, deduplicated: false }, ip_address: '10.0.0.10', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'ae-005', event_type: 'QUERY_COMPLETED', actor_id: 'operator2@pipeline.com', target_id: 'q-7e3b', target_type: 'query', payload_json: { risk_level: 'HIGH', confidence: 0.68, hitl_required: true }, ip_address: '10.0.0.15', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'ae-006', event_type: 'LOGIN', actor_id: 'engineer@pipeline.com', target_id: 'u-1a2b', target_type: 'user', payload_json: { mfa: true }, ip_address: '10.0.0.14', created_at: new Date(Date.now() - 86400000).toISOString() },
]

export default function AuditPage() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL')
  const [actorSearch, setActorSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const params = {
    event_type: eventTypeFilter !== 'ALL' ? eventTypeFilter : undefined,
    actor: actorSearch || undefined,
    page,
    page_size: 50,
  }

  const { data: auditData } = useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => getAuditLog(params, token),
    enabled: !!token,
  })

  const displayEvents = auditData?.items ?? MOCK_EVENTS

  return (
    <div className="p-6 space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4A5A72] pointer-events-none" />
          <Input
            placeholder="Search by actor…"
            value={actorSearch}
            onChange={(e) => setActorSearch(e.target.value)}
            className="pl-8 w-56"
          />
        </div>

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(auditExportUrl(token), '_blank')}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Audit table */}
      <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>ID</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEvents.map((event) => (
              <>
                <TableRow
                  key={event.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                >
                  <TableCell>
                    {expandedId === event.id
                      ? <ChevronDown className="w-3.5 h-3.5 text-[#4A5A72]" />
                      : <ChevronRight className="w-3.5 h-3.5 text-[#4A5A72]" />
                    }
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-[#4A5A72]">{truncate(event.id, 12)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={eventBadgeVariant[event.event_type] ?? 'default'} className="text-xs">
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#8B9BB4] text-xs">{event.actor_id}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-[#4A5A72]">{truncate(event.target_id, 10)}</span>
                    <span className="ml-1.5 text-[10px] text-[#4A5A72]">{event.target_type}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[#4A5A72]">{event.ip_address}</TableCell>
                  <TableCell className="text-xs text-[#8B9BB4]">{formatDate(event.created_at)}</TableCell>
                </TableRow>

                {expandedId === event.id && (
                  <TableRow key={`${event.id}-expanded`}>
                    <TableCell colSpan={7} className="bg-[#050D1A]">
                      <div className="p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72] mb-2">Payload</p>
                        <pre className="text-xs text-[#4AA8FF] font-mono leading-relaxed whitespace-pre-wrap bg-[#0A1628] border border-[#1C2E4A] rounded-lg p-4">
                          {JSON.stringify(event.payload_json, null, 2)}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-[#1C2E4A] flex items-center justify-between text-xs text-[#8B9BB4]">
          <span>
            Showing {displayEvents.length} of {auditData?.total ?? displayEvents.length} events
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#4A5A72] text-center">
        Audit log is read-only. Records are append-only and protected by PostgreSQL row-level security.
      </p>
    </div>
  )
}
