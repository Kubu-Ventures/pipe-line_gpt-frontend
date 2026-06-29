'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useRouter } from '@/lib/navigation'
import { Link } from '@/lib/navigation'
import { LangSwitcher } from '@/components/LangSwitcher'

const F        = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE     = '#006eb5'
const DARK     = '#232e3e'
const YELLOW   = '#ffeb00'
const AZURE    = '#60d4f2'
const GRAY_300 = '#edeff0'
const GRAY_400 = '#d4d6d8'
const GRAY_500 = '#a9b1b7'
const TEXT     = '#232e3e'

const DEMO_EMAIL    = 'demo-operator@pipelinegpt.xyz'
const DEMO_PASSWORD = 'DemoOp2026!'

export default function LoginPage() {
  const t      = useTranslations('login')
  const router = useRouter()
  const locale = useLocale()

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
      setError(t('error'))
      return
    }
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
        .undp-input {
          display: block; width: 100%; padding: 12px 16px;
          border: 2px solid ${GRAY_400}; border-radius: 0;
          font-size: 1rem; font-family: ${F};
          color: ${TEXT}; background: #fff; outline: none;
          transition: border-color 0.15s; box-sizing: border-box;
        }
        .undp-input:focus { border-color: ${BLUE}; }
        .undp-input::placeholder { color: ${GRAY_500}; }
        .undp-input.error { border-color: #d12800; background: #fff5f5; }
        .login-root { min-height: 100vh; display: flex; font-family: ${F}; background: ${GRAY_300}; }
        .login-left { width: 42%; flex-shrink: 0; position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .login-mobile-bar { display: none; }
        .login-right { flex: 1; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 48px; }
        @media (max-width: 1024px) {
          .login-left  { width: 36%; }
          .login-right { padding: 48px 36px; }
        }
        @media (max-width: 768px) {
          .login-root  { flex-direction: column; background: #fff; }
          .login-left  { display: none; }
          .login-mobile-bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 20px; height: 60px; flex-shrink: 0;
            background: ${DARK}; border-bottom: 3px solid ${YELLOW};
          }
          .login-right { flex: 1; padding: 32px 20px 40px; justify-content: flex-start; }
        }
        @media (max-width: 480px) { .login-right { padding: 28px 16px 36px; } }
      `}</style>

      <div className="login-root">
        {/* Mobile bar */}
        <div className="login-mobile-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden>
              <rect width="36" height="36" fill={BLUE} />
              <path d="M8 8h10c3.31 0 6 2.69 6 6s-2.69 6-6 6H8V8Z" fill="#fff" />
              <path d="M18 20l8 8h-7L15 20h3Z" fill="#fff" fillOpacity="0.55" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff', letterSpacing: '-0.02em' }}>PipelineGPT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LangSwitcher variant="dark" />
            <Link href="/" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
              {t('mobileHome')}
            </Link>
          </div>
        </div>

        {/* Left panel */}
        <div className="login-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1507823690283-48b0929e727b?q=80&w=1200&auto=format&fit=crop"
            alt="" aria-hidden
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(35,46,62,0.88) 0%, rgba(35,46,62,0.75) 60%, rgba(35,46,62,0.92) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 10, height: 4, background: YELLOW, flexShrink: 0 }} />
          <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px' }}>
            <Link href="/" style={{ fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.60)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden>←</span> {t('mobileHome').replace('←', '').trim() || 'Back to home'}
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
                  <rect width="36" height="36" fill={BLUE} />
                  <path d="M8 8h10c3.31 0 6 2.69 6 6s-2.69 6-6 6H8V8Z" fill="#fff" />
                  <path d="M18 20l8 8h-7L15 20h3Z" fill="#fff" fillOpacity="0.55" />
                </svg>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff', letterSpacing: '-0.02em' }}>PipelineGPT</span>
              </div>
              <div style={{ width: 40, height: 3, background: YELLOW, marginBottom: 20 }} />
              <h2 style={{ fontWeight: 700, fontSize: 'clamp(1.375rem, 2.5vw, 2rem)', lineHeight: '110%', letterSpacing: '-0.02em', color: '#fff', marginBottom: 16 }}>
                {t('leftHeadline')}
              </h2>
              <p style={{ fontSize: '0.9375rem', fontWeight: 400, lineHeight: '138%', color: 'rgba(255,255,255,0.55)', maxWidth: 300 }}>
                {t('leftSub')}
              </p>
            </div>
            <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
              {t('award')}
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-right">
          <div style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <LangSwitcher variant="light" />
            </div>
            <h1 style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2rem)', lineHeight: '110%', letterSpacing: '-0.02em', color: TEXT, marginBottom: 8 }}>
              {t('title')}
            </h1>
            <p style={{ fontSize: '1rem', fontWeight: 400, lineHeight: '138%', color: GRAY_500, marginBottom: 32 }}>
              {t('subtitle')}
            </p>

            {/* Demo button */}
            <button
              type="button"
              onClick={handleDemo}
              disabled={busy}
              style={{
                display: 'block', width: '100%', padding: '14px 24px',
                background: demoLoading ? '#1f5a95' : DARK,
                color: '#fff', border: `2px solid ${demoLoading ? '#1f5a95' : DARK}`,
                borderRadius: 0, fontSize: '0.9375rem', fontWeight: 600,
                letterSpacing: '0.02em', cursor: busy ? 'not-allowed' : 'pointer',
                marginBottom: 24, transition: 'background 0.15s, border-color 0.15s', textAlign: 'center',
              }}
            >
              {demoLoading ? <Spinner label={t('demoLoading')} /> : t('demoBtn')}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: GRAY_300 }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: GRAY_500, whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                {t('divider')}
              </span>
              <div style={{ flex: 1, height: 1, background: GRAY_300 }} />
            </div>

            {/* Credentials form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: TEXT, marginBottom: 8, letterSpacing: '0.01em' }}>
                  {t('emailLabel')}
                </label>
                <input
                  className={`undp-input${error ? ' error' : ''}`}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: TEXT, marginBottom: 8, letterSpacing: '0.01em' }}>
                  {t('passwordLabel')}
                </label>
                <input
                  className={`undp-input${error ? ' error' : ''}`}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
              </div>

              {error && (
                <div style={{ padding: '12px 16px', background: '#fff5f5', border: '2px solid #ffbcb7', fontSize: '0.875rem', color: '#d12800', marginBottom: 20, lineHeight: '138%' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  display: 'block', width: '100%', padding: '13px 24px',
                  background: 'transparent', color: busy ? GRAY_500 : BLUE,
                  border: `2px solid ${busy ? GRAY_400 : BLUE}`, borderRadius: 0,
                  fontSize: '0.9375rem', fontWeight: 600, letterSpacing: '0.02em',
                  cursor: busy ? 'not-allowed' : 'pointer', transition: 'color 0.15s, border-color 0.15s', textAlign: 'center',
                }}
              >
                {loading ? <Spinner label={t('signingIn')} color={BLUE} /> : t('signInBtn')}
              </button>
            </form>

            <p style={{ fontSize: '0.8125rem', fontWeight: 400, color: GRAY_500, marginTop: 32, lineHeight: '138%', textAlign: 'center' }}>
              © 2026 PipelineGPT ·{' '}
              <Link href="/" style={{ color: BLUE, textDecoration: 'none' }}>
                {t('mobileHome').replace('←', '').trim()}
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
        borderTopColor: color, borderRadius: '50%',
        display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
