const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const YELLOW = '#ffeb00'
const AZURE  = '#60d4f2'
const DARK   = '#232e3e'

const WORKFLOW = ['Upload', 'Query', 'Review', 'Analytics', 'Audit']

function StepProgress({ stepStr }: { stepStr: string }) {
  const match   = stepStr.match(/Step (\d+) of (\d+)/)
  const current = match ? parseInt(match[1]) : 0
  const total   = match ? parseInt(match[2]) : 5

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Step label row */}
      <p style={{
        fontFamily: F,
        fontSize: '0.6875rem', fontWeight: 700,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: AZURE, marginBottom: 18,
      }}>
        {stepStr}
      </p>

      {/* Visual step bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 480 }}>
        {WORKFLOW.slice(0, total).map((label, i) => {
          const stepNum  = i + 1
          const isDone   = stepNum < current
          const isCurr   = stepNum === current

          return (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Connector + dot row */}
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: 16 }}>
                {/* Left line */}
                {i > 0 && (
                  <div style={{
                    flex: 1, height: 1,
                    background: isDone || isCurr
                      ? AZURE
                      : 'rgba(255,255,255,0.18)',
                  }} />
                )}
                {/* Dot */}
                <div style={{
                  width:  isCurr ? 11 : 7,
                  height: isCurr ? 11 : 7,
                  background: isCurr ? YELLOW : isDone ? AZURE : 'transparent',
                  border:  !isDone && !isCurr
                    ? '1px solid rgba(255,255,255,0.28)'
                    : 'none',
                  borderRadius: '50%',
                  flexShrink: 0,
                }} />
                {/* Right line */}
                {i < total - 1 && (
                  <div style={{
                    flex: 1, height: 1,
                    background: isDone
                      ? AZURE
                      : 'rgba(255,255,255,0.18)',
                  }} />
                )}
              </div>

              {/* Step label */}
              <span style={{
                fontFamily: F,
                fontSize: '0.5625rem',
                fontWeight: isCurr ? 700 : 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isCurr ? YELLOW : isDone ? AZURE : 'rgba(255,255,255,0.30)',
                marginTop: 6,
                textAlign: 'center',
                lineHeight: 1,
              }}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PageHeroProps {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
  compact?: boolean
  step?: string
}

export function PageHero({ title, subtitle, cta, compact, step }: PageHeroProps) {
  return (
    <section>
      {/* UNDP yellow top rule — 4 px, full bleed */}
      <div style={{ height: 4, background: YELLOW }} />

      <div
        className="hero-pattern"
        style={{
          minHeight: compact ? 148 : 260,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="hero-inner" style={{ maxWidth: 1280 }}>
          <div style={{ maxWidth: 720 }}>

            {/* Step progress OR plain category label */}
            {step ? (
              <StepProgress stepStr={step} />
            ) : (
              <>
                <p style={{
                  fontFamily: F,
                  fontSize: '0.6875rem', fontWeight: 700,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: AZURE, marginBottom: 20,
                }}>
                  PipelineGPT · Pipeline Integrity Intelligence
                </p>
              </>
            )}

            {/* UNDP yellow accent bar */}
            <div style={{ width: 44, height: 3, background: YELLOW, marginBottom: 18 }} />

            {/* Title */}
            <h1 style={{
              fontFamily: F,
              fontSize: compact ? '1.625rem' : '2.25rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: '110%',
              color: '#fff',
              marginBottom: subtitle ? 14 : 0,
            }}>
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p style={{
                fontFamily: F,
                fontSize: '0.9375rem',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.62)',
                lineHeight: '138%',
                marginBottom: cta ? 28 : 0,
                maxWidth: 600,
              }}>
                {subtitle}
              </p>
            )}

            {/* Optional CTA */}
            {cta && (
              <a
                href={cta.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '11px 28px',
                  background: BLUE,
                  color: '#fff',
                  textDecoration: 'none',
                  fontFamily: F,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  border: `2px solid ${BLUE}`,
                  borderRadius: 0,
                }}
              >
                {cta.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
