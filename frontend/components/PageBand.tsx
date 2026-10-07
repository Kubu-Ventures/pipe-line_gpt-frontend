import Link from 'next/link'

const PHOTO = 'https://images.unsplash.com/photo-1559510981-10719ce4266a?q=80&w=1600&auto=format&fit=crop'

export interface BandStat {
  value: string | number
  label: string
  /** Colour for the number, e.g. a warning red; white by default */
  tone?: string
  href?: string
}

/**
 * The slim page header used on the work pages: the pipeline photo under a dark
 * gradient, a title, one line of explanation, and the page's key numbers as text.
 */
export function PageBand({ eyebrow, title, description, stats = [], actions, compact = false }: {
  eyebrow: string
  title: string
  description?: string
  stats?: BandStat[]
  actions?: React.ReactNode
  /** A slimmer band for work pages where the content should start sooner */
  compact?: boolean
}) {
  return (
    <header style={{ position: 'relative', flexShrink: 0, overflow: 'hidden', background: '#1B2533', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={PHOTO} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(27,37,51,0.96) 0%, rgba(27,37,51,0.88) 45%, rgba(27,37,51,0.55) 100%)' }} />
      <div className="band-inner" style={{ position: 'relative', padding: compact ? '14px 32px' : '22px 32px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: compact ? '0 0 3px' : '0 0 6px', fontSize: 11.5, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8CC8F0' }}>{eyebrow}</p>
          <h1 style={{ margin: 0, fontSize: compact ? 20 : 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{title}</h1>
          {description && <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,0.72)', maxWidth: 620, lineHeight: 1.5 }}>{description}</p>}
        </div>
        {(stats.length > 0 || actions) && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
            {stats.map(s => {
              const body = (
                <>
                  <strong style={{ display: 'block', fontSize: 22, fontWeight: 700, lineHeight: 1.1, color: s.tone ?? '#fff' }}>{s.value}</strong>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>{s.label}</span>
                </>
              )
              return s.href ? (
                <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>{body}</Link>
              ) : (
                <div key={s.label}>{body}</div>
              )
            })}
            {actions}
          </div>
        )}
      </div>
      <style>{`@media (max-width: 900px) { .band-inner { padding: 18px 16px !important; } }`}</style>
    </header>
  )
}
