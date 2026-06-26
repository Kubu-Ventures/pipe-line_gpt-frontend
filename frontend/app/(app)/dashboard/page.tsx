'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  MessageSquare,
  ClipboardCheck,
  Target,
  Database,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { getDashboardStats } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

const CHART_STYLE = {
  tickStyle: { fill: '#8B9BB4', fontSize: 11 },
  tooltipStyle: {
    backgroundColor: '#0F1E38',
    border: '1px solid #1C2E4A',
    borderRadius: '8px',
    color: '#E8EDF4',
    fontSize: 12,
  },
}

const eventTypeBadge: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'default'> = {
  QUERY_COMPLETED: 'primary',
  HITL_APPROVED: 'success',
  HITL_REJECTED: 'danger',
  INGEST_COMPLETED: 'success',
  LOGIN: 'default',
}

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
  suffix = '',
}: {
  label: string
  value: number | string
  trend?: number
  icon: React.ElementType
  suffix?: string
}) {
  return (
    <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5A72]">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#1D6FD9]/10 border border-[#1D6FD9]/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#1D6FD9]" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[#E8EDF4] tracking-tight tabular-nums">
          {value}{suffix}
        </span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs mb-1 ${trend >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className="text-xs text-[#8B9BB4]">Last 30 days</span>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const token = session?.accessToken ?? ''

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(token),
    enabled: !!token,
    refetchInterval: 60_000,
  })

  const mockStats = {
    total_queries: 1_284,
    total_queries_trend: 12,
    hitl_pending: 3,
    avg_confidence: 0.87,
    documents_ingested: 48,
    queries_by_day: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      count: Math.floor(20 + Math.random() * 80),
    })),
    incidents_by_year: [
      { year: 2015, count: 112 },
      { year: 2016, count: 98 },
      { year: 2017, count: 134 },
      { year: 2018, count: 121 },
      { year: 2019, count: 89 },
      { year: 2020, count: 76 },
      { year: 2021, count: 103 },
      { year: 2022, count: 118 },
      { year: 2023, count: 95 },
    ],
    recent_events: [
      { id: 'ae-001', event_type: 'QUERY_COMPLETED', actor_id: 'operator@pipeline.com', target_id: 'q-abc', target_type: 'query', payload_json: {}, created_at: new Date().toISOString() },
      { id: 'ae-002', event_type: 'HITL_APPROVED', actor_id: 'engineer@pipeline.com', target_id: 'r-xyz', target_type: 'review', payload_json: {}, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'ae-003', event_type: 'INGEST_COMPLETED', actor_id: 'admin@pipeline.com', target_id: 'd-def', target_type: 'document', payload_json: {}, created_at: new Date(Date.now() - 1800000).toISOString() },
    ],
  }

  const d = stats ?? mockStats

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Queries" value={d.total_queries.toLocaleString()} trend={d.total_queries_trend} icon={MessageSquare} />
        <StatCard label="HITL Pending" value={d.hitl_pending} icon={ClipboardCheck} />
        <StatCard label="Avg Confidence" value={Math.round(d.avg_confidence * 100)} suffix="%" icon={Target} />
        <StatCard label="Documents Ingested" value={d.documents_ingested} icon={Database} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* PHMSA Incidents by Year */}
        <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#E8EDF4] mb-4">PHMSA Incident Count by Year</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.incidents_by_year} barSize={28}>
              <CartesianGrid stroke="#1C2E4A" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="year" tick={CHART_STYLE.tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_STYLE.tickStyle} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={CHART_STYLE.tooltipStyle}
                cursor={{ fill: 'rgba(29,111,217,0.06)' }}
              />
              <Bar dataKey="count" fill="#1D6FD9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Query Volume */}
        <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl p-5">
          <p className="text-sm font-semibold text-[#E8EDF4] mb-4">Query Volume — Last 30 Days</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={d.queries_by_day}>
              <CartesianGrid stroke="#1C2E4A" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="date" tick={CHART_STYLE.tickStyle} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={CHART_STYLE.tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_STYLE.tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4AA8FF"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#4AA8FF' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-[#0A1628] border border-[#1C2E4A] rounded-xl">
        <div className="px-5 py-4 border-b border-[#1C2E4A]">
          <p className="text-sm font-semibold text-[#E8EDF4]">Recent Activity</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {d.recent_events.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Badge variant={eventTypeBadge[e.event_type] ?? 'default'} className="text-xs">
                    {e.event_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#8B9BB4]">{e.actor_id}</TableCell>
                <TableCell className="font-mono text-xs text-[#4A5A72]">{e.target_id}</TableCell>
                <TableCell className="text-[#8B9BB4] text-xs">{formatDate(e.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
