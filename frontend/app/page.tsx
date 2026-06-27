'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'
import { TopNav } from '@/components/TopNav'

/* ── Reusable "Next Step" footer ─────────────────────────────── */
export function NextStep({ href, label, description }: {
  href: string; label: string; description: string
}) {
  return (
    <div style={{ background: '#E8F0F9', borderTop: '1px solid #C5D8EF', padding: '20px 32px' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#005DAA', marginBottom: 3 }}>
            Next Step
          </p>
          <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#1A1A2A' }}>{label}</p>
          <p style={{ fontFamily: F, fontSize: 13, color: '#4A5568', marginTop: 2 }}>{description}</p>
        </div>
        <Link href={href} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px',
          border: '2px solid #001B3A',
          background: '#001B3A', color: '#fff',
          textDecoration: 'none',
          fontFamily: F, fontSize: 12, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
        }}>
          {label} <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/* ── Constants ────────────────────────────────────────────────── */
const PIPE_TYPES = [
  'Gas Transmission',
  'Hazardous Liquid',
  'Offshore / Subsea',
  'Distribution Network',
  'Gathering Lines',
]

const ANALYSIS_TYPES = [
  'ILI Report Analysis',
  'SCADA Data Review',
  'PHMSA Incident Trends',
  'Corrosion Risk Assessment',
  'Compliance Review',
  'Integrity Management',
]

/* ROSEN brand fonts: Inter (or system sans-serif) — clean and corporate */
const F = 'Inter, system-ui, sans-serif'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pipeType,     setPipeType]     = useState('')
  const [analysisType, setAnalysisType] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  const canSubmit = pipeType.length > 0 && analysisType.length > 0

  function handleBegin(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    router.push(`/ingest?${new URLSearchParams({ pipeType, analysisType })}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F4F7', fontFamily: F }}>
      <TopNav />

      {/* ── Hero — ROSEN dark navy, white text, ROSEN blue accent ── */}
      <section style={{
        background: 'linear-gradient(135deg, #001020 0%, #001B3A 60%, #00285A 100%)',
        padding: '64px 32px 56px',
        borderBottom: '4px solid #005DAA',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{
            fontFamily: F, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#5B9BD4',        /* ROSEN blue tint — not E4C teal */
            marginBottom: 16,
          }}>
            AI-Powered Pipeline Integrity Intelligence
          </p>
          <h1 style={{
            fontFamily: F, fontWeight: 700, fontSize: 38,
            lineHeight: '48px', color: '#FFFFFF',
            marginBottom: 20, maxWidth: 620,
            letterSpacing: '-0.02em',
          }}>
            Query Your Pipeline Data<br />in Plain English
          </h1>
          <p style={{
            fontFamily: F, fontWeight: 400, fontSize: 17,
            lineHeight: '27px', color: 'rgba(255,255,255,0.60)',
            maxWidth: 540,
          }}>
            Upload ILI reports, SCADA exports, and PHMSA datasets. Ask any question.
            Get cited answers. Every high-risk recommendation reviewed by a qualified engineer.
          </p>
        </div>
      </section>

      {/* ── Action form ── */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 64px' }}>
        <form onSubmit={handleBegin}>

          {/* Pipeline type chips */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#005DAA',        /* ROSEN blue label */
              marginBottom: 14,
            }}>
              What type of pipeline are you working with?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PIPE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setPipeType(t)}
                  style={{
                    fontFamily: F, fontSize: 14,
                    padding: '9px 20px',
                    border: pipeType === t ? '2px solid #005DAA' : '1px solid #C5D8EF',
                    background: pipeType === t ? '#005DAA' : '#FFFFFF',
                    color: pipeType === t ? '#FFFFFF' : '#005DAA',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis type chips */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#005DAA',
              marginBottom: 14,
            }}>
              What do you need to analyse?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ANALYSIS_TYPES.map(a => (
                <button key={a} type="button" onClick={() => setAnalysisType(a)}
                  style={{
                    fontFamily: F, fontSize: 14,
                    padding: '9px 20px',
                    border: analysisType === a ? '2px solid #001B3A' : '1px solid #D1D5DB',
                    background: analysisType === a ? '#001B3A' : '#FFFFFF',
                    color: analysisType === a ? '#FFFFFF' : '#374151',
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Info box — ROSEN blue left border */}
          <div style={{
            background: '#E8F0F9',
            borderLeft: '4px solid #005DAA',
            padding: '16px 20px',
            marginBottom: 32,
          }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#001B3A', marginBottom: 10,
            }}>
              What happens after you begin
            </p>
            {[
              'Step 1 — Upload your pipeline documents (PDF, CSV, GeoJSON, ZIP)',
              'Step 2 — Ask questions in plain English; the AI retrieves cited answers from your data',
              'Step 3 — High-risk recommendations are routed to a qualified engineer for sign-off',
              'Step 4 — View trends, confidence scores, and query analytics on the dashboard',
              'Step 5 — Export your immutable audit trail for PHMSA compliance reporting',
            ].map(item => (
              <p key={item} style={{
                fontFamily: F, fontSize: 14,
                color: '#1A3A5C',      /* ROSEN dark blue text, not E4C teal */
                marginBottom: 4, lineHeight: 1.55,
              }}>
                ✓ {item}
              </p>
            ))}
          </div>

          {/* CTA — dotted border, ROSEN dark navy */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              fontFamily: F,
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              width: '100%', padding: '14px 24px',
              border: canSubmit ? '2px dotted #001B3A' : '2px dotted #9CA3AF',
              background: canSubmit ? '#001B3A' : '#F3F4F6',
              color: canSubmit ? '#FFFFFF' : '#9CA3AF',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            {canSubmit
              ? `Begin Analysis — ${pipeType} · ${analysisType} →`
              : 'Select a pipeline type and analysis type to continue'}
          </button>
        </form>

        <p style={{
          fontFamily: F, fontSize: 12, color: '#8896A8',
          lineHeight: 1.6, marginTop: 28,
        }}>
          PipelineGPT is a prototype submitted for the ASME Foundation Hermann Rosen Award
          for Pipeline Innovation 2026. All AI outputs require human review before any pipeline
          action is taken. No unreviewed recommendation ever triggers an operational change.
        </p>
      </main>
    </div>
  )
}
