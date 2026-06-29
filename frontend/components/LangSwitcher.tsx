'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/lib/navigation'
import { locales, localeNames, type Locale } from '@/i18n/routing'

const F = 'Inter, "Proxima Nova", ProximaNova, sans-serif'

export function LangSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const locale   = useLocale() as Locale
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function switchLocale(next: Locale) {
    setOpen(false)
    router.replace(pathname, { locale: next })
  }

  const isDark   = variant === 'dark'
  const fg       = isDark ? 'rgba(255,255,255,0.85)' : '#55606e'
  const border   = isDark ? 'rgba(255,255,255,0.25)' : '#d4d6d8'
  const hoverBg  = isDark ? 'rgba(255,255,255,0.08)' : '#f5f7f9'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          background: 'none',
          border: `1px solid ${border}`,
          cursor: 'pointer',
          fontFamily: F, fontSize: 11, fontWeight: 700,
          color: fg, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}
      >
        <Globe size={13} color={fg} />
        {locale.toUpperCase()}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0,
          background: '#fff',
          border: '1px solid #d4d6d8',
          boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          minWidth: 170, zIndex: 500,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '9px 14px',
                background: loc === locale ? '#f0f6ff' : 'none',
                border: 'none', borderBottom: '1px solid #f0f0f0',
                textAlign: 'left', fontFamily: F, fontSize: 13,
                color: loc === locale ? '#006eb5' : '#232e3e',
                fontWeight: loc === locale ? 700 : 400,
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (loc !== locale) e.currentTarget.style.background = hoverBg }}
              onMouseLeave={e => { if (loc !== locale) e.currentTarget.style.background = 'none' }}
            >
              <span>{localeNames[loc]}</span>
              {loc === locale && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#006eb5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
