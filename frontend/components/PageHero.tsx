interface PageHeroProps {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
  compact?: boolean
  step?: string
}

export function PageHero({ title, subtitle, cta, compact, step }: PageHeroProps) {
  return (
    <section
      className="hero-pattern"
      style={{
        minHeight: compact ? '160px' : '260px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="hero-inner" style={{ maxWidth: '1280px' }}>
        <div style={{ maxWidth: '640px' }}>
          {step ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <p style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#7FB4E0',
                margin: 0,
              }}>
                {step}
              </p>
              <div style={{ height: '1px', width: '32px', background: 'rgba(127,180,224,0.4)' }} />
              <p style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(127,180,224,0.55)',
                margin: 0,
              }}>
                PipelineGPT · ROSEN
              </p>
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#7FB4E0',
                marginBottom: '12px',
              }}
            >
              PipelineGPT · ROSEN Technology
            </p>
          )}
          <h1
            style={{
              fontSize: compact ? '1.875rem' : '2.5rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              lineHeight: 1.2,
              marginBottom: subtitle ? '16px' : '0',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: '1.0625rem',
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.6,
                marginBottom: cta ? '28px' : '0',
              }}
            >
              {subtitle}
            </p>
          )}
          {cta && (
            <a
              href={cta.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 24px',
                background: '#005DAA',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              {cta.label}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
