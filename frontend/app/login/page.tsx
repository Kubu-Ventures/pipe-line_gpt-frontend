'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// UNDP Design System tokens — mirrors landing page exactly
// Font: Inter (ProximaNova substitute)
// Brand blue: #006eb5  Dark: #232e3e  Yellow: #ffeb00  Azure: #60d4f2
// Border: 2px (no radius — UNDP rectangular style)
// Body: 1.25rem / 138%  Label: 0.875rem  Header: 75px
// ─────────────────────────────────────────────────────────────────────────────

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'
const AZURE  = '#60d4f2'
const GRAY_300 = '#edeff0'
const GRAY_400 = '#d4d6d8'
const GRAY_500 = '#a9b1b7'
const TEXT   = '#232e3e'

const DEMO_EMAIL    = 'demo-operator@pipelinegpt.com'
const DEMO_PASSWORD = 'DemoOp2026!'

export default function LoginPage() {
  const router = useRouter()
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  const busy = loading || demoLoading

  async function doSignIn(e: string, p: string, setL: (b: boolean) => void) {
    setL(true)
    setError(null)
    const res = await signIn('credentials', { email: e, password: p, redirect: false })
    if (res?.error) {
      setL(false)
      setError('Incorrect email or password.')
      return
    }
    // Check whether MFA setup is required before redirecting
    const session = await fetch('/api/auth/session').then(r => r.json()).catch(() => null)
    setL(false)
    if (session?.user?.mfaSetupRequired) {
      router.push('/mfa-setup')
    } else {
      router.push('/home')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSignIn(email, password, setLoading)
  }

  async function handleDemo() {
    doSignIn(DEMO_EMAIL, DEMO_PASSWORD, setDemoLoading)
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* UNDP-style inputs: 2px border, no radius, rectangular */
        .undp-input {
          display: block; width: 100%;
          padding: 12px 16px;
          border: 2px solid ${GRAY_400};
          border-radius: 0;
          font-size: 1rem; font-family: ${F};
          color: ${TEXT}; background: #fff;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .undp-input:focus { border-color: ${BLUE}; }
        .undp-input::placeholder { color: ${GRAY_500}; }
        .undp-input.error { border-color: #d12800; background: #fff5f5; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: F,
        background: GRAY_300,
      }}>

        {/* ── LEFT PANEL: pipeline image + branding ────────────────────── */}
        <div style={{
          width: '42%', flexShrink: 0,
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Forest pipeline photograph (confirmed real pipeline) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1507823690283-48b0929e727b?q=80&w=1200&auto=format&fit=crop"
            alt=""
            aria-hidden
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
            }}
          />
          {/* Dark overlay — UNDP ebony clay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom,
              rgba(35,46,62,0.88) 0%,
              rgba(35,46,62,0.75) 60%,
              rgba(35,46,62,0.92) 100%)`,
          }} />

          {/* UNDP yellow top bar */}
          <div style={{
            position: 'relative', zIndex: 10,
            height: 4, background: YELLOW, flexShrink: 0,
          }} />

          {/* Panel content */}
          <div style={{
            position: 'relative', zIndex: 10,
            flex: 1, display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '40px 48px',
          }}>
            {/* Top: back link */}
            <Link href="/" style={{
              fontFamily: F, fontSize: '0.875rem', fontWeight: 400,
              color: 'rgba(255,255,255,0.60)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span aria-hidden>←</span> Back to home
            </Link>

            {/* Middle: wordmark + value prop */}
            <div>
              {/* Wordmark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
                  <rect width="36" height="36" fill={BLUE} />
                  <path d="M8 8h10c3.31 0 6 2.69 6 6s-2.69 6-6 6H8V8Z" fill="#fff" />
                  <path d="M18 20l8 8h-7L15 20h3Z" fill="#fff" fillOpacity="0.55" />
                </svg>
                <span style={{
                  fontFamily: F, fontWeight: 700, fontSize: '1.25rem',
                  color: '#fff', letterSpacing: '-0.02em',
                }}>
                  PipelineGPT
                </span>
              </div>

              {/* Yellow accent */}
              <div style={{ width: 40, height: 3, background: YELLOW, marginBottom: 20 }} />

              {/* Headline */}
              <h2 style={{
                fontFamily: F, fontWeight: 700,
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                lineHeight: '110%',
                letterSpacing: '-0.02em',
                color: '#fff',
                marginBottom: 16,
              }}>
                Pipeline integrity<br />intelligence, powered<br />by plain English.
              </h2>

              {/* Body */}
              <p style={{
                fontFamily: F, fontSize: '0.9375rem', fontWeight: 400,
                lineHeight: '138%', color: 'rgba(255,255,255,0.55)',
                maxWidth: 300,
              }}>
                PHMSA incident data · ILI report analysis · SCADA exports · Cited answers · Engineer review
              </p>
            </div>

            {/* Bottom: award badge */}
            <p style={{
              fontFamily: F, fontSize: '0.6875rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.30)',
              letterSpacing: '0.10em', textTransform: 'uppercase' as const,
            }}>
              ASME Foundation · Hermann Rosen Award 2026
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: form ────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>

            {/* Heading */}
            <h1 style={{
              fontFamily: F, fontWeight: 700,
              fontSize: '2rem',            // heading-medium
              lineHeight: '110%',
              letterSpacing: '-0.02em',
              color: TEXT,
              marginBottom: 8,
            }}>
              Sign in
            </h1>
            <p style={{
              fontFamily: F, fontSize: '1rem', fontWeight: 400,
              lineHeight: '138%', color: GRAY_500,
              marginBottom: 36,
            }}>
              Access is by invitation only. Use your credentials or the demo account.
            </p>

            {/* ── Demo button — primary action ── */}
            <button
              type="button"
              onClick={handleDemo}
              disabled={busy}
              style={{
                display: 'block', width: '100%',
                padding: '14px 24px',
                background: demoLoading ? '#1f5a95' : DARK,
                color: '#fff',
                border: `2px solid ${demoLoading ? '#1f5a95' : DARK}`,
                borderRadius: 0,
                fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                letterSpacing: '0.02em',
                cursor: busy ? 'not-allowed' : 'pointer',
                marginBottom: 24,
                transition: 'background 0.15s, border-color 0.15s',
                textAlign: 'center' as const,
              }}
            >
              {demoLoading ? <Spinner label="Loading demo…" /> : 'Continue as demo user →'}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
            }}>
              <div style={{ flex: 1, height: 1, background: GRAY_300 }} />
              <span style={{
                fontFamily: F, fontSize: '0.75rem', fontWeight: 400,
                color: GRAY_500, whiteSpace: 'nowrap' as const,
                letterSpacing: '0.04em',
              }}>
                or sign in with credentials
              </span>
              <div style={{ flex: 1, height: 1, background: GRAY_300 }} />
            </div>

            {/* ── Credentials form ── */}
            <form onSubmit={handleSubmit}>

              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block',
                  fontFamily: F, fontSize: '0.875rem', fontWeight: 600,
                  color: TEXT, marginBottom: 8, letterSpacing: '0.01em',
                }}>
                  Email address
                </label>
                <input
                  className={`undp-input${error ? ' error' : ''}`}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@organization.com"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={{
                  display: 'block',
                  fontFamily: F, fontSize: '0.875rem', fontWeight: 600,
                  color: TEXT, marginBottom: 8, letterSpacing: '0.01em',
                }}>
                  Password
                </label>
                <input
                  className={`undp-input${error ? ' error' : ''}`}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fff5f5',
                  border: `2px solid #ffbcb7`,
                  fontFamily: F, fontSize: '0.875rem',
                  color: '#d12800',
                  marginBottom: 20, lineHeight: '138%',
                }}>
                  {error}
                </div>
              )}

              {/* Sign in button — UNDP outlined/secondary */}
              <button
                type="submit"
                disabled={busy}
                style={{
                  display: 'block', width: '100%',
                  padding: '13px 24px',
                  background: 'transparent',
                  color: busy ? GRAY_500 : BLUE,
                  border: `2px solid ${busy ? GRAY_400 : BLUE}`,
                  borderRadius: 0,
                  fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  transition: 'color 0.15s, border-color 0.15s',
                  textAlign: 'center' as const,
                }}
              >
                {loading ? <Spinner label="Signing in…" color={BLUE} /> : 'Sign In'}
              </button>
            </form>

            {/* Footer link */}
            <p style={{
              fontFamily: F, fontSize: '0.8125rem', fontWeight: 400,
              color: GRAY_500, marginTop: 36, lineHeight: '138%',
              textAlign: 'center' as const,
            }}>
              © 2026 PipelineGPT ·{' '}
              <Link href="/" style={{ color: BLUE, textDecoration: 'none' }}>
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function Spinner({ label, color = '#fff' }: { label: string; color?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
      <span style={{
        width: 14, height: 14,
        border: `2px solid ${color === '#fff' ? 'rgba(255,255,255,0.35)' : 'rgba(0,110,181,0.25)'}`,
        borderTopColor: color,
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
