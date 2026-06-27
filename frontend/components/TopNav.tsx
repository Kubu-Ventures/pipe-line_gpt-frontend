'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/ingest',    label: 'Upload Data'   },
  { href: '/chat',      label: 'Ask Questions' },
  { href: '/review',    label: 'Review'        },
  { href: '/dashboard', label: 'Analytics'     },
  { href: '/audit',     label: 'Audit Trail'   },
]

const F = 'Inter, system-ui, sans-serif'

export function TopNav({ activeTab }: { activeTab?: string }) {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const [userMenuOpen, setUserMenuOpen]   = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E4E8EF',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        position: 'relative',
      }}>

        {/* ── Logo ── */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ border: '2px solid #005DAA', padding: '2px 8px' }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: '#005DAA', letterSpacing: '0.08em' }}>
              ROSEN
            </span>
          </div>
          <span style={{ fontFamily: F, fontWeight: 400, fontSize: 15, color: '#1A1A2A' }}>
            PipelineGPT
          </span>
        </Link>

        {/* ── Desktop nav links ── */}
        <nav className="nav-desktop">
          {NAV_LINKS.map(link => {
            const isActive = !!pathname?.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: F, fontSize: 14,
                  color: isActive ? '#005DAA' : '#4A5568',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  borderBottom: isActive ? '2px solid #005DAA' : '2px solid transparent',
                  paddingBottom: 2,
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* ── Right: award badge + user + hamburger ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

          {/* Award badge — hidden on tablet/mobile via CSS */}
          <div className="nav-award" style={{ border: '2px dotted #005DAA', padding: '4px 12px' }}>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 10, color: '#005DAA', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
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
                  background: '#001B3A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: F,
                }}>
                  {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
                </div>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 38, right: 0,
                  background: '#fff', border: '1px solid #E4E8EF',
                  borderRadius: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 190, zIndex: 100,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                    <p style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: '#1A1A2A', marginBottom: 1 }}>
                      {session.user.name ?? 'User'}
                    </p>
                    <p style={{ fontFamily: F, fontSize: 11, color: '#8896A8' }}>{session.user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{ fontFamily: F, display: 'block', width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#4A5568', cursor: 'pointer' }}
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
            {mobileNavOpen ? <X size={22} color="#1A1A2A" /> : <Menu size={22} color="#1A1A2A" />}
          </button>
        </div>

        {/* ── Mobile nav overlay ── */}
        <nav className={`mobile-nav${mobileNavOpen ? ' open' : ''}`}>
          {NAV_LINKS.map(link => {
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
          })}
          <div style={{ padding: '12px 24px', background: '#F8F9FB', borderTop: '1px solid #E4E8EF' }}>
            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 700, color: '#005DAA', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Hermann Rosen Award 2026
            </span>
          </div>
        </nav>
      </div>
    </header>
  )
}
