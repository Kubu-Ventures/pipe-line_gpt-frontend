'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/ingest',    label: 'Upload Data',   roles: null              },
  { href: '/chat',      label: 'Ask Questions', roles: null              },
  { href: '/review',    label: 'Review',        roles: ['ENGINEER','ADMIN'] },
  { href: '/dashboard', label: 'Analytics',     roles: null              },
  { href: '/audit',     label: 'Audit Trail',   roles: null              },
  { href: '/admin',     label: 'Admin',         roles: ['ADMIN']         },
]

const F    = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE = '#006eb5'
const DARK = '#232e3e'
const YELLOW = '#ffeb00'

export function TopNav({ activeTab }: { activeTab?: string }) {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen]   = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #edeff0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* UNDP yellow top rule */}
      <div style={{ height: 4, background: YELLOW }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 40px', height: 71,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        position: 'relative',
      }}>

        {/* ── Logo ── */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
            <rect width="30" height="30" fill={BLUE} />
            <path d="M6 6h8.5c2.76 0 5 2.24 5 5s-2.24 5-5 5H6V6Z" fill="#fff" />
            <path d="M14.5 16l6.5 6.5h-5l-3.5-6.5h2Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: DARK, letterSpacing: '-0.01em' }}>
            PipelineGPT
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <nav className="nav-desktop">
          {NAV_LINKS
            .filter(link => !link.roles || link.roles.includes(session?.user?.role ?? ''))
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

        {/* ── Right: award badge + user + hamburger ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Award badge — hidden on tablet/mobile via CSS */}
          <div className="nav-award" style={{
            border: `1px solid #d4d6d8`,
            padding: '4px 12px',
          }}>
            <span style={{
              fontFamily: F, fontWeight: 600, fontSize: 10,
              color: '#55606e', letterSpacing: '0.10em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              Hermann Rosen Award 2026
            </span>
          </div>

          {/* User avatar + dropdown */}
          {session?.user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setUserMenuOpen(o => !o); setMobileNavOpen(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: DARK,
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
                    {session.user.role && (
                      <span style={{
                        fontFamily: F, fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.10em', textTransform: 'uppercase',
                        background: session.user.role === 'ADMIN' ? '#EDE9FE' : session.user.role === 'ENGINEER' ? '#FEF3C7' : '#dff0ff',
                        color: session.user.role === 'ADMIN' ? '#5B21B6' : session.user.role === 'ENGINEER' ? '#B45309' : BLUE,
                        padding: '2px 7px',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}>
                        {session.user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{ fontFamily: F, display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#55606e', cursor: 'pointer' }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Hamburger — shown on mobile via CSS */}
          <button
            className="nav-hamburger"
            onClick={() => { setMobileNavOpen(o => !o); setUserMenuOpen(false) }}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileNavOpen ? <X size={22} color={DARK} /> : <Menu size={22} color={DARK} />}
          </button>
        </div>

        {/* ── Mobile nav overlay ── */}
        <nav className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
          {NAV_LINKS
            .filter(link => !link.roles || link.roles.includes(session?.user?.role ?? ''))
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
          <div style={{ padding: '12px 24px', background: '#edeff0', borderTop: '1px solid #d4d6d8' }}>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: '#55606e', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              Hermann Rosen Award 2026
            </span>
          </div>
        </nav>
      </div>
    </header>
  )
}
