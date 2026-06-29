'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle, Edit3, XCircle, FileText, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { DecisionModal } from './DecisionModal'
import { SourcePanel } from './SourcePanel'
import { useSubmitDecision } from '@/hooks/useReviewQueue'
import { injectCitationLabels } from '@/lib/utils'
import type { ReviewItem } from '@/lib/api'

const F    = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'

const RISK_CONFIG = {
  HIGH:   { label: 'HIGH RISK',   bg: '#FDF4F4', border: '#E8BCBC', bar: '#991B1B', text: '#991B1B', badge: '#991B1B', badgeBg: '#FAE0E0' },
  MEDIUM: { label: 'MEDIUM RISK', bg: '#FFFBEB', border: '#FDE68A', bar: '#D97706', text: '#B45309', badge: '#B45309', badgeBg: '#FEF3C7' },
  LOW:    { label: 'LOW RISK',    bg: '#FFFFFF', border: '#d4d6d8', bar: '#1A7A4A', text: '#1A7A4A', badge: '#1A7A4A', badgeBg: '#D1FAE5' },
}

const STATUS_CONFIG = {
  PENDING:  { label: 'Pending Review', color: '#B45309', bg: '#FEF3C7' },
  APPROVED: { label: 'Approved',       color: '#1A7A4A', bg: '#D1FAE5' },
  REJECTED: { label: 'Rejected',       color: '#7F1D1D', bg: '#FAE0E0' },
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value < 70 ? '#991B1B' : value < 85 ? '#D97706' : '#1A7A4A'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#a9b1b7' }}>
          AI Confidence
        </span>
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      {/* UNDP rectangular progress bar */}
      <div style={{ height: 4, background: '#d4d6d8', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 0.4s ease' }} />
      </div>
      {value < 70 && (
        <p style={{ fontFamily: F, fontSize: 11, color: '#991B1B', marginTop: 5, fontWeight: 500 }}>
          Low confidence — review carefully before approving
        </p>
      )}
    </div>
  )
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [expanded,    setExpanded]    = useState(item.risk_level === 'HIGH')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [modalMode,   setModalMode]   = useState<'EDIT' | 'REJECT' | null>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const { mutate, isPending } = useSubmitDecision()

  const risk   = RISK_CONFIG[item.risk_level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.LOW
  const status = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
  const conf   = Math.round(item.confidence_score * 100)
  const isPend = item.status === 'PENDING'
  const isHigh = item.risk_level === 'HIGH'

  const renderedText = injectCitationLabels(item.answer_text ?? '', item.citations_json ?? [])
  const PREVIEW_LEN  = 280
  const shortText    = renderedText.slice(0, PREVIEW_LEN)
  const hasMore      = renderedText.length > PREVIEW_LEN

  const handleApprove = () => mutate({ queryId: item.query_id, decision: { decision: 'APPROVE' } })
  const openModal = (mode: 'EDIT' | 'REJECT') => { setModalMode(mode); setModalOpen(true) }

  return (
    <>
      {/* UNDP-style card: thick left border as risk indicator, no border-radius */}
      <div style={{
        background: risk.bg,
        borderTop: `1px solid ${risk.border}`,
        borderRight: `1px solid ${risk.border}`,
        borderBottom: `1px solid ${risk.border}`,
        borderLeft: `5px solid ${risk.bar}`,
        marginBottom: 12,
        overflow: 'hidden',
        opacity: !isPend ? 0.78 : 1,
      }}>

        {/* HIGH RISK banner */}
        {isHigh && isPend && (
          <div style={{
            background: '#991B1B', padding: '9px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid #7f1d1d',
          }}>
            <AlertTriangle size={13} color="#fff" />
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              High-risk recommendation · Engineer sign-off mandatory before operational use
            </span>
          </div>
        )}

        <div style={{ padding: '20px 24px' }}>

          {/* Row 1: risk badge + status + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {/* Risk badge — rectangular, UNDP */}
            <span style={{
              fontFamily: F, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.10em', textTransform: 'uppercase',
              background: risk.badgeBg, color: risk.badge,
              padding: '3px 10px',
              border: `1px solid ${risk.border}`,
            }}>
              {risk.label}
            </span>

            {status && (
              <span style={{
                fontFamily: F, fontSize: 10, fontWeight: 600,
                background: status.bg, color: status.color,
                padding: '3px 10px',
                border: `1px solid ${status.bg}`,
              }}>
                {status.label}
              </span>
            )}

            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>
              <Clock size={11} /> {timeAgo(item.created_at)}
            </span>

            {(item.citations_json?.length ?? 0) > 0 && (
              <button
                onClick={() => setSourcesOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: F, fontSize: 11, fontWeight: 600, color: BLUE,
                  background: '#dff0ff', padding: '3px 10px',
                  border: `1px solid #b8d4f0`, cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#c8e4f8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#dff0ff')}
              >
                <FileText size={11} />
                {item.citations_json?.length} source{(item.citations_json?.length ?? 0) !== 1 ? 's' : ''} cited
              </button>
            )}
          </div>

          {/* Row 2: query */}
          <p style={{
            fontFamily: F, fontSize: 14, fontWeight: 600,
            color: DARK, lineHeight: 1.55,
            marginBottom: 12,
            fontStyle: 'italic',
          }}>
            "{item.question_raw}"
          </p>

          {/* Row 3: AI response box */}
          <div style={{
            background: 'rgba(255,255,255,0.75)',
            border: `1px solid ${risk.border}`,
            borderLeft: `3px solid #a9b1b7`,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a9b1b7', marginBottom: 8 }}>
              AI Response
            </p>
            <div style={{ fontFamily: F, fontSize: 14, color: '#55606e', lineHeight: 1.75 }} className="review-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{expanded ? renderedText : shortText + (!expanded && hasMore ? '…' : '')}</ReactMarkdown>
            </div>
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  fontFamily: F, background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: BLUE,
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, padding: 0,
                }}
              >
                {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read full response</>}
              </button>
            )}
          </div>

          {/* Row 4: confidence bar + action buttons */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>

            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <ConfidenceBar value={conf} />
            </div>

            {/* PENDING: action buttons — UNDP rectangular, 2px border */}
            {isPend && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px',
                    background: '#1A7A4A', color: '#fff',
                    border: '2px solid #1A7A4A',
                    fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#15653D' }}
                  onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = '#1A7A4A' }}
                >
                  <CheckCircle size={13} /> Approve
                </button>

                <button
                  onClick={() => openModal('EDIT')}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px',
                    background: '#fff', color: BLUE,
                    border: `2px solid ${BLUE}`,
                    fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#dff0ff' }}
                  onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = '#fff' }}
                >
                  <Edit3 size={13} /> Edit & Approve
                </button>

                <button
                  onClick={() => openModal('REJECT')}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 16px',
                    background: '#fff', color: '#991B1B',
                    border: '2px solid #FCA5A5',
                    fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = '#FEF2F2' }}
                  onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = '#fff' }}
                >
                  <XCircle size={13} /> Reject
                </button>
              </div>
            )}

            {/* Completed state */}
            {!isPend && status && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: status.bg,
                border: `1px solid ${item.status === 'APPROVED' ? '#A7F3D0' : '#FCA5A5'}`,
              }}>
                {item.status === 'APPROVED'
                  ? <CheckCircle size={14} color="#1A7A4A" />
                  : <XCircle size={14} color="#991B1B" />
                }
                <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: status.color }}>
                  {status.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <DecisionModal
        item={item}
        open={modalOpen}
        initialMode={modalMode}
        onClose={() => { setModalOpen(false); setModalMode(null) }}
        onDecision={d => mutate({ queryId: item.query_id, decision: d }, { onSuccess: () => setModalOpen(false) })}
        isPending={isPending}
      />

      <SourcePanel
        citations={item.citations_json ?? []}
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
      />
    </>
  )
}
