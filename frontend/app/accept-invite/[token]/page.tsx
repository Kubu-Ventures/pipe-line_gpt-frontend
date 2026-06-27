'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'
const GRAY_400 = '#d4d6d8'
const GRAY_500 = '#a9b1b7'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail ?? 'This invitation link is invalid or has expired.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Could not connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .inv-input {
          display: block; width: 100%; padding: 12px 16px;
          border: 2px solid ${GRAY_400}; border-radius: 0;
          font-size: 1rem; font-family: ${F}; color: ${DARK};
          background: #fff; outline: none; transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .inv-input:focus { border-color: ${BLUE}; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
        {/* UNDP yellow top rule */}
        <div style={{ height: 4, background: YELLOW }} />

        {/* Dark header bar */}
        <div style={{ background: DARK, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden>
            <rect width="30" height="30" fill={BLUE} />
            <path d="M6 6h8.5c2.76 0 5 2.24 5 5s-2.24 5-5 5H6V6Z" fill="#fff" />
            <path d="M14.5 16l6.5 6.5h-5l-3.5-6.5h2Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: '#fff' }}>PipelineGPT</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', border: '1px solid #d4d6d8' }}>

            {/* Card header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edeff0' }}>
              <div style={{ width: 36, height: 3, background: YELLOW, marginBottom: 14 }} />
              <h1 style={{ fontFamily: F, fontSize: '1.5rem', fontWeight: 700, color: DARK, marginBottom: 6, lineHeight: '110%' }}>
                Set your password
              </h1>
              <p style={{ fontFamily: F, fontSize: '0.875rem', color: GRAY_500, lineHeight: '138%' }}>
                You've been invited to PipelineGPT. Choose a strong password to activate your account.
              </p>
            </div>

            {/* Card body */}
            <div style={{ padding: '24px 32px 28px' }}>
              {success ? (
                <div>
                  <div style={{ padding: '16px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderLeft: '4px solid #1A7A4A', marginBottom: 24 }}>
                    <p style={{ fontFamily: F, fontSize: '0.9375rem', fontWeight: 600, color: '#065F46' }}>
                      Account activated successfully.
                    </p>
                    <p style={{ fontFamily: F, fontSize: '0.875rem', color: '#065F46', marginTop: 4 }}>
                      You can now sign in with your email and the password you just set.
                    </p>
                  </div>
                  <Link
                    href="/login"
                    style={{
                      display: 'block', textAlign: 'center',
                      padding: '13px 24px', background: DARK, color: '#fff',
                      textDecoration: 'none', fontFamily: F, fontSize: '0.9375rem',
                      fontWeight: 600, border: `2px solid ${DARK}`,
                    }}
                  >
                    Sign in →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontFamily: F, fontSize: '0.875rem', fontWeight: 600, color: DARK, marginBottom: 8 }}>
                      New password
                    </label>
                    <input
                      className="inv-input"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontFamily: F, fontSize: '0.875rem', fontWeight: 600, color: DARK, marginBottom: 8 }}>
                      Confirm password
                    </label>
                    <input
                      className="inv-input"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      required
                    />
                  </div>

                  {error && (
                    <div style={{ padding: '12px 16px', background: '#fff5f5', border: '2px solid #ffbcb7', borderLeft: '4px solid #d12800', fontFamily: F, fontSize: '0.875rem', color: '#d12800', marginBottom: 20 }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'block', width: '100%', padding: '13px 24px',
                      background: loading ? '#1f5a95' : BLUE, color: '#fff',
                      border: `2px solid ${loading ? '#1f5a95' : BLUE}`,
                      fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Activating…
                      </span>
                    ) : 'Activate account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
