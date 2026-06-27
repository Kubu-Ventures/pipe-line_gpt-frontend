'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'
import { TopNav } from '@/components/TopNav'

// ─────────────────────────────────────────────────────────────────────────────
// UNDP Design System tokens
// ─────────────────────────────────────────────────────────────────────────────
const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'
const AZURE  = '#60d4f2'

/* ── Reusable "Next Step" footer ─────────────────────────────── */
export function NextStep({ href, label, description }: {
  href: string; label: string; description: string
}) {
  return (
    <div style={{ background: '#edeff0', borderTop: `4px solid ${YELLOW}` }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '20px 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: BLUE, marginBottom: 4 }}>
            Next Step
          </p>
          <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: DARK }}>{label}</p>
          <p style={{ fontFamily: F, fontSize: 13, color: '#55606e', marginTop: 3 }}>{description}</p>
        </div>
        <Link href={href} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px',
          border: `2px solid ${DARK}`,
          background: DARK, color: '#fff',
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
    <div style={{ minHeight: '100vh', background: '#edeff0', fontFamily: F }}>
      <TopNav />

      {/* ── Hero ── */}
      <section>
        {/* UNDP yellow top rule */}
        <div style={{ height: 4, background: YELLOW }} />
        <div
          className="hero-pattern"
          style={{ padding: '56px 40px 52px', borderBottom: `1px solid rgba(255,255,255,0.08)` }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: AZURE, marginBottom: 18,
            }}>
              AI-Powered Pipeline Integrity Intelligence
            </p>
            {/* UNDP yellow accent bar */}
            <div style={{ width: 48, height: 3, background: YELLOW, marginBottom: 20 }} />
            <h1 style={{
              fontFamily: F, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              lineHeight: '110%', color: '#FFFFFF',
              marginBottom: 18, maxWidth: 640,
              letterSpacing: '-0.025em',
            }}>
              Query Your Pipeline Data<br />in Plain English
            </h1>
            <p style={{
              fontFamily: F, fontWeight: 400, fontSize: '1.0625rem',
              lineHeight: '138%', color: 'rgba(255,255,255,0.62)',
              maxWidth: 520,
            }}>
              Upload ILI reports, SCADA exports, and PHMSA datasets. Ask any question.
              Get cited answers. Every high-risk recommendation reviewed by a qualified engineer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Action form ── */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px 64px' }}>
        <form onSubmit={handleBegin}>

          {/* Pipeline type chips */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: BLUE, marginBottom: 14,
            }}>
              What type of pipeline are you working with?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PIPE_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setPipeType(t)}
                  style={{
                    fontFamily: F, fontSize: 14,
                    padding: '9px 20px',
                    border: pipeType === t ? `2px solid ${BLUE}` : '1px solid #d4d6d8',
                    background: pipeType === t ? BLUE : '#FFFFFF',
                    color: pipeType === t ? '#FFFFFF' : BLUE,
                    cursor: 'pointer', transition: 'all 0.12s',
                    borderRadius: 0,
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
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: BLUE, marginBottom: 14,
            }}>
              What do you need to analyse?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ANALYSIS_TYPES.map(a => (
                <button key={a} type="button" onClick={() => setAnalysisType(a)}
                  style={{
                    fontFamily: F, fontSize: 14,
                    padding: '9px 20px',
                    border: analysisType === a ? `2px solid ${DARK}` : '1px solid #d4d6d8',
                    background: analysisType === a ? DARK : '#FFFFFF',
                    color: analysisType === a ? '#FFFFFF' : '#55606e',
                    cursor: 'pointer', transition: 'all 0.12s',
                    borderRadius: 0,
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div style={{
            background: '#fff',
            borderLeft: `4px solid ${BLUE}`,
            padding: '16px 20px',
            marginBottom: 32,
          }}>
            <p style={{
              fontFamily: F, fontWeight: 700, fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: DARK, marginBottom: 12,
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
                color: '#55606e',
                marginBottom: 5, lineHeight: 1.55,
              }}>
                ✓ {item}
              </p>
            ))}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              fontFamily: F,
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              width: '100%', padding: '14px 24px',
              border: canSubmit ? `2px solid ${DARK}` : '2px solid #d4d6d8',
              background: canSubmit ? DARK : '#edeff0',
              color: canSubmit ? '#FFFFFF' : '#a9b1b7',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              borderRadius: 0,
            }}
          >
            {canSubmit
              ? `Begin Analysis — ${pipeType} · ${analysisType} →`
              : 'Select a pipeline type and analysis type to continue'}
          </button>
        </form>

        <p style={{
          fontFamily: F, fontSize: 12, color: '#a9b1b7',
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
