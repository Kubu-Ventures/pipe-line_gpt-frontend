'use client'

import { useState } from 'react'
import { CheckCircle, Edit3, XCircle, FileText, Clock, ChevronDown, ChevronUp, AlertTriangle, User } from 'lucide-react'
import { DecisionModal } from './DecisionModal'
import { SourcePanel } from './SourcePanel'
import { useSubmitDecision } from '@/hooks/useReviewQueue'
import type { ReviewItem } from '@/lib/api'

const F = 'Inter, system-ui, sans-serif'

/* Deep crimson (#991B1B) instead of alarm red (#991B1B) —
   communicates severity without the visual aggression of a pure red */
const RISK_CONFIG = {
  HIGH:   { label: 'HIGH RISK',   bg: '#FDF4F4', border: '#E8BCBC', bar: '#991B1B', text: '#991B1B', badge: '#991B1B', badgeBg: '#FAE0E0' },
  MEDIUM: { label: 'MEDIUM RISK', bg: '#FFFBEB', border: '#FDE68A', bar: '#D97706', text: '#B45309', badge: '#B45309', badgeBg: '#FEF3C7' },
  LOW:    { label: 'LOW RISK',    bg: '#FFFFFF', border: '#E4E8EF', bar: '#1A7A4A', text: '#1A7A4A', badge: '#1A7A4A', badgeBg: '#D1FAE5' },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8896A8' }}>
          AI Confidence
        </span>
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: '#E4E8EF', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      {value < 70 && (
        <p style={{ fontFamily: F, fontSize: 11, color: '#991B1B', marginTop: 4, fontWeight: 500 }}>
          Low confidence — review carefully before approving
        </p>
      )}
    </div>
  )
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [expanded,     setExpanded]     = useState(item.risk_level === 'HIGH')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [modalMode,    setModalMode]    = useState<'EDIT' | 'REJECT' | null>(null)
  const [sourcesOpen,  setSourcesOpen]  = useState(false)
  const { mutate, isPending } = useSubmitDecision()

  const risk    = RISK_CONFIG[item.risk_level as keyof typeof RISK_CONFIG] ?? RISK_CONFIG.LOW
  const status  = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
  const conf    = Math.round(item.confidence_score * 100)
  const isPend  = item.status === 'PENDING'
  const isHigh  = item.risk_level === 'HIGH'

  const PREVIEW_LEN = 280
  const shortText   = item.answer_text.slice(0, PREVIEW_LEN)
  const hasMore     = item.answer_text.length > PREVIEW_LEN

  const handleApprove = () => mutate({ queryId: item.query_id, decision: { decision: 'APPROVE' } })
  const openModal = (mode: 'EDIT' | 'REJECT') => { setModalMode(mode); setModalOpen(true) }

  return (
    <>
      <div className="rosen-card" style={{
        background: risk.bg,
        border: `1px solid ${risk.border}`,
        borderLeft: `5px solid ${risk.bar}`,
        borderRadius: 6,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: isHigh ? '0 2px 12px rgba(153,27,27,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
        opacity: !isPend ? 0.75 : 1,
      }}>

        {/* ── HIGH RISK warning banner ── */}
        {isHigh && isPend && (
          <div style={{
            background: '#991B1B', padding: '8px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={14} color="#fff" />
            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              High-risk recommendation — operational action required · engineer sign-off mandatory
            </span>
          </div>
        )}

        {/* ── Card body ── */}
        <div style={{ padding: '20px 24px' }}>

          {/* Row 1: badges + meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            {/* Risk badge */}
            <span style={{
              fontFamily: F, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: risk.badgeBg, color: risk.badge,
              padding: '3px 10px', borderRadius: 3,
              border: `1px solid ${risk.border}`,
            }}>
              {risk.label}
            </span>

            {/* Status badge */}
            {status && (
              <span style={{
                fontFamily: F, fontSize: 11, fontWeight: 600,
                background: status.bg, color: status.color,
                padding: '3px 10px', borderRadius: 3,
              }}>
                {status.label}
              </span>
            )}

            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F, fontSize: 12, color: '#8896A8' }}>
              <Clock size={12} /> {timeAgo(item.created_at)}
            </span>

            {item.user_email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: F, fontSize: 12, color: '#8896A8' }}>
                <User size={12} /> {item.user_email}
              </span>
            )}

            {(item.citations_json?.length ?? item.chunk_count ?? 0) > 0 && (
              <button
                onClick={() => setSourcesOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontFamily: F, fontSize: 12, fontWeight: 600, color: '#005DAA',
                  background: '#E8F0F9', padding: '3px 10px', borderRadius: 3,
                  border: '1px solid #C5D8EF', cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#D1E6F7')}
                onMouseLeave={e => (e.currentTarget.style.background = '#E8F0F9')}
              >
                <FileText size={11} />
                {item.citations_json?.length ?? item.chunk_count} source{(item.citations_json?.length ?? item.chunk_count ?? 0) !== 1 ? 's' : ''} cited
                <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>↗</span>
              </button>
            )}
          </div>

          {/* Row 2: question */}
          <p style={{
            fontFamily: F, fontSize: 15, fontWeight: 600,
            color: '#1A1A2A', lineHeight: 1.5,
            marginBottom: 12,
            fontStyle: 'italic',
          }}>
            "{item.question_raw}"
          </p>

          {/* Row 3: AI response */}
          <div style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid #E4E8EF',
            borderRadius: 4,
            padding: '14px 16px',
            marginBottom: 16,
          }}>
            <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8896A8', marginBottom: 8 }}>
              AI Response
            </p>
            <p style={{ fontFamily: F, fontSize: 14, color: '#374151', lineHeight: 1.75 }}>
              {expanded ? item.answer_text : shortText}
              {!expanded && hasMore && '…'}
            </p>
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                style={{
                  fontFamily: F, background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#005DAA',
                  display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, padding: 0,
                }}
              >
                {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read full response</>}
              </button>
            )}
          </div>

          {/* Row 4: confidence + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>

            {/* Confidence bar */}
            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <ConfidenceBar value={conf} />
            </div>

            {/* Action buttons — only show for PENDING */}
            {isPend && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 18px',
                    background: '#1A7A4A', color: '#fff',
                    border: 'none', borderRadius: 4,
                    fontSize: 13, fontWeight: 700,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                    letterSpacing: '0.02em',
                  }}
                >
                  <CheckCircle size={15} /> Approve
                </button>

                <button
                  onClick={() => openModal('EDIT')}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 18px',
                    background: '#FFFFFF', color: '#005DAA',
                    border: '1.5px solid #005DAA', borderRadius: 4,
                    fontSize: 13, fontWeight: 600,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Edit3 size={14} /> Edit & Approve
                </button>

                <button
                  onClick={() => openModal('REJECT')}
                  disabled={isPending}
                  style={{
                    fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 18px',
                    background: '#FFFFFF', color: '#991B1B',
                    border: '1.5px solid #FCA5A5', borderRadius: 4,
                    fontSize: 13, fontWeight: 600,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            )}

            {/* Completed state */}
            {!isPend && status && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                background: status.bg, borderRadius: 4,
                border: `1px solid`,
                borderColor: item.status === 'APPROVED' ? '#A7F3D0' : '#FCA5A5',
              }}>
                {item.status === 'APPROVED'
                  ? <CheckCircle size={15} color="#1A7A4A" />
                  : <XCircle size={15} color="#991B1B" />
                }
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: status.color }}>
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
