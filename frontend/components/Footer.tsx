'use client'

import { useTranslations } from 'next-intl'

const F    = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const DARK = '#232e3e'

export function Footer() {
  const t = useTranslations('footer')

  return (
    <footer style={{ background: DARK, fontFamily: F }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '32px 40px',
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
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>PipelineGPT</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#a9b1b7', lineHeight: 1.6 }}>{t('copyright')}</p>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#a9b1b7', lineHeight: 1.6, maxWidth: 420, textAlign: 'right' }}>
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  )
}
