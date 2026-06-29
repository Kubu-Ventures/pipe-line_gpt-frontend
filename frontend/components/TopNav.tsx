'use client'

import { usePathname, useRouter } from '@/lib/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X, Globe } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/lib/navigation'
import { locales, localeNames, type Locale } from '@/i18n/routing'

const F    = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'
const YELLOW = '#ffeb00'

export function TopNav({ activeTab }: { activeTab?: string }) {
  const t        = useTranslations('nav')
  const pathname = usePathname()
  const router   = useRouter()
  const locale   = useLocale() as Locale
  const { data: session } = useSession()
  const userRole = ((session as any)?.user?.role as string | undefined) ?? ''
  const [userMenuOpen,   setUserMenuOpen]   = useState(false)
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false)
  const [langMenuOpen,   setLangMenuOpen]   = useState(false)

  const NAV_LINKS = [
    { href: '/ingest' as const,    label: t('uploadData'),   roles: null                    },
    { href: '/chat' as const,      label: t('askQuestions'), roles: null                    },
    { href: '/review' as const,    label: t('review'),       roles: ['ENGINEER', 'ADMIN']   },
    { href: '/dashboard' as const, label: t('analytics'),    roles: null                    },
    { href: '/audit' as const,     label: t('auditTrail'),   roles: ['ENGINEER', 'ADMIN']   },
    { href: '/admin' as const,     label: t('admin'),        roles: ['ADMIN']               },
  ]

  function switchLocale(next: Locale) {
    setLangMenuOpen(false)
    router.replace(pathname, { locale: next })
  }

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid #edeff0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ height: 4, background: YELLOW }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 40px', height: 71,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        position: 'relative',
      }}>

        {/* Logo */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
            <rect width="30" height="30" fill={BLUE} />
            <path d="M6 6h8.5c2.76 0 5 2.24 5 5s-2.24 5-5 5H6V6Z" fill="#fff" />
            <path d="M14.5 16l6.5 6.5h-5l-3.5-6.5h2Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: DARK, letterSpacing: '-0.01em' }}>PipelineGPT</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="nav-desktop">
          {NAV_LINKS
            .filter(link => !link.roles || link.roles.includes(userRole))
            .map(link => {
              const isActive = !!pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: F, fontSize: 14,
                    color: isActive ? BLUE : '#55606e',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 400,
                    borderBottom: isActive ? `2px solid ${BLUE}` : '2px solid transparent',
                    paddingBottom: 2,
                    transition: 'color 0.15s',
                  }}
                >
                  {link.label}
                </Link>
              )
            })
          }
        </nav>

        {/* Right: award badge + language + user + hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Award badge */}
          <div className="nav-award" style={{ border: '1px solid #d4d6d8', padding: '4px 12px' }}>
            <span style={{ fontFamily: F, fontWeight: 600, fontSize: 10, color: '#55606e', letterSpacing: '0.10em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {t('award')}
            </span>
          </div>

          {/* Language switcher */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setLangMenuOpen(o => !o); setUserMenuOpen(false); setMobileNavOpen(false) }}
              aria-label={t('language')}
              title={t('language')}
              style={{ background: 'none', border: '1px solid #d4d6d8', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Globe size={14} color="#55606e" />
              <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: '#55606e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {locale.toUpperCase()}
              </span>
            </button>

            {langMenuOpen && (
              <div style={{
                position: 'absolute', top: 36, right: 0,
                background: '#fff', border: '1px solid #d4d6d8',
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                minWidth: 160, zIndex: 200,
                maxHeight: 320, overflowY: 'auto',
              }}>
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    style={{
                      fontFamily: F, display: 'block', width: '100%',
                      padding: '8px 14px', background: loc === locale ? '#f0f4ff' : 'none',
                      border: 'none', textAlign: 'left', fontSize: 13,
                      color: loc === locale ? BLUE : '#55606e',
                      fontWeight: loc === locale ? 600 : 400,
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User avatar + dropdown */}
          {session?.user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setUserMenuOpen(o => !o); setMobileNavOpen(false); setLangMenuOpen(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: DARK,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: F,
                }}>
                  {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 38, right: 0,
                  background: '#fff', border: '1px solid #d4d6d8',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 190, zIndex: 100,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #edeff0' }}>
                    <p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 2 }}>
                      {session.user.name ?? 'User'}
                    </p>
                    <p style={{ fontFamily: F, fontSize: 11, color: '#a9b1b7', marginBottom: 4 }}>{session.user.email}</p>
                    {userRole && (
                      <span style={{
                        fontFamily: F, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.10em', textTransform: 'uppercase',
                        background: userRole === 'ADMIN' ? '#EDE9FE' : userRole === 'ENGINEER' ? '#FEF3C7' : '#dff0ff',
                        color: userRole === 'ADMIN' ? '#5B21B6' : userRole === 'ENGINEER' ? '#B45309' : BLUE,
                        padding: '2px 7px', border: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        {userRole}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
                    style={{ fontFamily: F, display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#55606e', cursor: 'pointer' }}
                  >
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => { setMobileNavOpen(o => !o); setUserMenuOpen(false); setLangMenuOpen(false) }}
            aria-label={mobileNavOpen ? t('closeMenu') : t('openMenu')}
          >
            {mobileNavOpen ? <X size={22} color={DARK} /> : <Menu size={22} color={DARK} />}
          </button>
        </div>

        {/* Mobile nav overlay */}
        <nav className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
          {NAV_LINKS
            .filter(link => !link.roles || link.roles.includes(userRole))
            .map(link => {
              const isActive = !!pathname?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive ? 'active' : ''}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })
          }
          {/* Mobile language switcher */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid #d4d6d8' }}>
            <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: '#55606e', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8 }}>
              {t('language')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => { switchLocale(loc); setMobileNavOpen(false) }}
                  style={{
                    fontFamily: F, fontSize: 11, fontWeight: 600,
                    padding: '4px 8px',
                    background: loc === locale ? BLUE : 'transparent',
                    color: loc === locale ? '#fff' : '#55606e',
                    border: `1px solid ${loc === locale ? BLUE : '#d4d6d8'}`,
                    cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px 24px', background: '#edeff0', borderTop: '1px solid #d4d6d8' }}>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: '#55606e', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {t('award')}
            </span>
          </div>
        </nav>
      </div>
    </header>
  )
}
