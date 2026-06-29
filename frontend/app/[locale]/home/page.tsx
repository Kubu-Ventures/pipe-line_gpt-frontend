'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/navigation'
import { TopNav } from '@/components/TopNav'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'
const AZURE  = '#60d4f2'

export default function HomePage() {
  const t = useTranslations('home')
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pipeType,     setPipeType]     = useState('')
  const [analysisType, setAnalysisType] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  const PIPE_TYPES = [
    { key: 'gasTransmission',   label: t('gasTransmission') },
    { key: 'hazardousLiquid',   label: t('hazardousLiquid') },
    { key: 'offshorePipeline',  label: t('offshorePipeline') },
    { key: 'distributionNetwork', label: t('distributionNetwork') },
    { key: 'gatheringLines',    label: t('gatheringLines') },
  ]

  const ANALYSIS_TYPES = [
    { key: 'iliReport',      label: t('iliReport') },
    { key: 'scadaReview',    label: t('scadaReview') },
    { key: 'phmsaTrends',    label: t('phmsaTrends') },
    { key: 'corrosionRisk',  label: t('corrosionRisk') },
    { key: 'complianceReview', label: t('complianceReview') },
    { key: 'integrityMgmt',  label: t('integrityMgmt') },
  ]

  const canSubmit = pipeType.length > 0 && analysisType.length > 0

  function handleBegin(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    router.push(`/ingest?${new URLSearchParams({ pipeType, analysisType })}`)
  }

  const STEPS = [t('step1'), t('step2'), t('step3'), t('step4'), t('step5')]

  return (
    <div style={{ minHeight: '100vh', background: '#edeff0', fontFamily: F }}>
      <TopNav />

      {/* Hero */}
      <section>
        <div style={{ height: 4, background: YELLOW }} />
        <div className="hero-pattern" style={{ padding: '56px 40px 52px', borderBottom: 'rgba(255,255,255,0.08)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: AZURE, marginBottom: 18 }}>
              {t('eyebrow')}
            </p>
            <div style={{ width: 48, height: 3, background: YELLOW, marginBottom: 20 }} />
            <h1 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: '110%', color: '#FFFFFF', marginBottom: 18, maxWidth: 640, letterSpacing: '-0.025em' }}>
              {t('headline')}
            </h1>
            <p style={{ fontFamily: F, fontWeight: 400, fontSize: '1.0625rem', lineHeight: '138%', color: 'rgba(255,255,255,0.62)', maxWidth: 520 }}>
              {t('subtext')}
            </p>
          </div>
        </div>
      </section>

      {/* Action form */}
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 40px 64px' }}>
        <form onSubmit={handleBegin}>

          {/* Pipeline type chips */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: BLUE, marginBottom: 14 }}>
              {t('pipeQuestion')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PIPE_TYPES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setPipeType(label)}
                  style={{
                    fontFamily: F, fontSize: 14, padding: '9px 20px',
                    border: pipeType === label ? `2px solid ${BLUE}` : '1px solid #d4d6d8',
                    background: pipeType === label ? BLUE : '#FFFFFF',
                    color: pipeType === label ? '#FFFFFF' : BLUE,
                    cursor: 'pointer', transition: 'all 0.12s', borderRadius: 0,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis type chips */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: BLUE, marginBottom: 14 }}>
              {t('analysisQuestion')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ANALYSIS_TYPES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setAnalysisType(label)}
                  style={{
                    fontFamily: F, fontSize: 14, padding: '9px 20px',
                    border: analysisType === label ? `2px solid ${DARK}` : '1px solid #d4d6d8',
                    background: analysisType === label ? DARK : '#FFFFFF',
                    color: analysisType === label ? '#FFFFFF' : '#55606e',
                    cursor: 'pointer', transition: 'all 0.12s', borderRadius: 0,
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div style={{ background: '#fff', borderLeft: `4px solid ${BLUE}`, padding: '16px 20px', marginBottom: 32 }}>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: DARK, marginBottom: 12 }}>
              {t('infoTitle')}
            </p>
            {STEPS.map((item, i) => (
              <p key={i} style={{ fontFamily: F, fontSize: 14, color: '#55606e', marginBottom: 5, lineHeight: 1.55 }}>
                ✓ {item}
              </p>
            ))}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              fontFamily: F, fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              width: '100%', padding: '14px 24px',
              border: canSubmit ? `2px solid ${DARK}` : '2px solid #d4d6d8',
              background: canSubmit ? DARK : '#edeff0',
              color: canSubmit ? '#FFFFFF' : '#a9b1b7',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s', borderRadius: 0,
            }}
          >
            {canSubmit
              ? t('beginBtn', { pipeType, analysisType })
              : t('beginDisabled')}
          </button>
        </form>

        <p style={{ fontFamily: F, fontSize: 12, color: '#a9b1b7', lineHeight: 1.6, marginTop: 28 }}>
          {t('disclaimer')}
        </p>
      </main>
    </div>
  )
}
