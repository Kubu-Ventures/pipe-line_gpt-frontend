'use client'

import { useTranslations } from 'next-intl'

const F    = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const DARK = '#232e3e'
const GRAY = '#a9b1b7'
const BLUE = '#60d4f2'

const REPOS = [
  { label: 'Frontend', href: 'https://github.com/Kubu-Ventures/Rosen-frontend' },
  { label: 'Backend',  href: 'https://github.com/Kubu-Ventures/Rosen-backend'  },
]

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer style={{ background: DARK, fontFamily: F }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '28px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>

        <div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <rect width="20" height="20" fill="#006eb5" />
              <path d="M4 4h5.5c1.93 0 3.5 1.57 3.5 3.5S11.43 11 9.5 11H4V4Z" fill="#fff" />
              <path d="M9.5 11l4.5 5h-3.5l-2.5-5h1.5Z" fill="#fff" fillOpacity="0.55" />
            </svg>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              PipelineGPT
            </span>
          </div>

          <p style={{ fontSize: '0.75rem', color: GRAY, lineHeight: 1.6, marginBottom: 8 }}>
            {t('copyright')}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                fill={GRAY} />
            </svg>
            <span style={{ fontSize: '0.75rem', color: GRAY }}>Source:</span>
            {REPOS.map((r, i) => (
              <span key={r.label} style={{ fontSize: '0.75rem' }}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: BLUE, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  {r.label}
                </a>
                {i < REPOS.length - 1 && <span style={{ color: GRAY }}> · </span>}
              </span>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: GRAY, lineHeight: 1.6, maxWidth: 420, textAlign: 'right' }}>
          {t('disclaimer')}
        </p>

      </div>
    </footer>
  )
}
