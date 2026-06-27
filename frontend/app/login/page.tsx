'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setAuthError(null)
    const res = await signIn('credentials', { ...data, redirect: false })
    setLoading(false)
    if (res?.error) setAuthError('The email or password you entered is incorrect.')
    else router.push('/')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #F4F5F7; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .field input { display: block; width: 100%; padding: 10px 12px; border: 1px solid #CBD5E0; border-radius: 4px; font-size: 15px; color: #1A202C; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
        .field input:focus { border-color: #005DAA; box-shadow: 0 0 0 3px rgba(0,93,170,0.08); }
        .field input::placeholder { color: #A0AEC0; }
        .field input.err { border-color: #E53E3E; background: #FFF5F5; }
        .submit-btn { display: block; width: 100%; padding: 11px; background: #005DAA; color: #fff; font-size: 15px; font-weight: 600; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; transition: background 0.15s; letter-spacing: 0.01em; }
        .submit-btn:hover:not(:disabled) { background: #004A8F; }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .ms-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 10px; background: #fff; color: #3C4149; font-size: 14px; font-weight: 500; border: 1px solid #CBD5E0; border-radius: 4px; cursor: pointer; font-family: inherit; transition: background 0.15s, border-color 0.15s; }
        .ms-btn:hover { background: #F7FAFC; border-color: #A0AEC0; }
        a { color: #005DAA; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#F4F5F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="28" height="28" rx="5" fill="#005DAA" />
              <path d="M7 7h7.5c2.485 0 4.5 2.015 4.5 4.5S16.985 16 14.5 16H7V7Z" fill="white" />
              <path d="M14.5 16L21 21H16L12 16h2.5Z" fill="white" fillOpacity="0.7" />
            </svg>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C', letterSpacing: '-0.02em' }}>
              Pipeline<span style={{ color: '#005DAA', fontWeight: 700 }}>GPT</span>
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#718096', letterSpacing: '0.01em' }}>
            ROSEN Group · Pipeline Integrity Intelligence
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: '#ffffff',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '32px',
        }}>

          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1A202C',
            marginBottom: '6px',
            letterSpacing: '-0.01em',
          }}>
            Sign in to your account
          </h1>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '24px', lineHeight: 1.5 }}>
            Use your ROSEN Group credentials to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* Email */}
            <div className="field" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4A5568', marginBottom: '5px' }}>
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@rosen-group.com"
                className={errors.email ? 'err' : ''}
              />
              {errors.email && (
                <p style={{ fontSize: '12px', color: '#E53E3E', marginTop: '4px' }}>{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="field" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#4A5568' }}>Password</label>
                <a href="#" style={{ fontSize: '13px' }}>Forgot password?</a>
              </div>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={errors.password ? 'err' : ''}
              />
              {errors.password && (
                <p style={{ fontSize: '12px', color: '#E53E3E', marginTop: '4px' }}>{errors.password.message}</p>
              )}
            </div>

            {/* Auth error */}
            {authError && (
              <div style={{
                padding: '10px 12px',
                background: '#FFF5F5',
                border: '1px solid #FED7D7',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#C53030',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}>
                {authError}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="submit-btn" style={{ marginBottom: '16px' }}>
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
              <span style={{ fontSize: '12px', color: '#A0AEC0', whiteSpace: 'nowrap' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            </div>

            {/* Microsoft SSO */}
            <button type="button" className="ms-btn">
              {/* Microsoft logo */}
              <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </button>
          </form>
        </div>

        {/* ── Below card ── */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#718096' }}>
            Don&apos;t have an account?{' '}
            <a href="#" style={{ fontWeight: 600 }}>Request access</a>
          </p>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#CBD5E0', lineHeight: 1.8 }}>
            © 2026 ROSEN Group · All rights reserved<br />
            <a href="#" style={{ color: '#CBD5E0' }}>Privacy Policy</a>
            {' · '}
            <a href="#" style={{ color: '#CBD5E0' }}>Terms of Use</a>
            {' · '}
            <a href="#" style={{ color: '#CBD5E0' }}>Contact Support</a>
          </p>
        </div>

      </div>
    </>
  )
}
