'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Smartphone, Copy, CheckCircle } from 'lucide-react'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'
const GRAY_400 = '#d4d6d8'
const GRAY_500 = '#a9b1b7'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export default function MFASetupPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [step,        setStep]        = useState<'qr' | 'verify' | 'done'>('qr')
  const [uri,         setUri]         = useState('')
  const [secret,      setSecret]      = useState('')
  const [code,        setCode]        = useState('')
  const [error,       setError]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    if (!session?.accessToken) return
    fetch(`${API_URL}/auth/mfa/setup`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(r => r.json())
      .then(d => { setUri(d.provisioning_uri ?? ''); setSecret(d.secret ?? '') })
      .catch(() => setError('Could not load MFA setup. Please refresh.'))
  }, [session?.accessToken])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ code: code.replace(/\s/g, '') }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail ?? 'Invalid code. Check your authenticator app.')
      } else {
        setStep('done')
      }
    } catch {
      setError('Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const qrUrl = uri ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uri)}` : ''

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .mfa-input {
          display: block; width: 100%; padding: 14px 16px; text-align: center;
          border: 2px solid ${GRAY_400}; border-radius: 0; letter-spacing: 0.3em;
          font-size: 1.5rem; font-family: monospace; color: ${DARK};
          background: #fff; outline: none; transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .mfa-input:focus { border-color: ${BLUE}; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
        <div style={{ height: 4, background: YELLOW }} />

        <div style={{ background: DARK, padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" fill={BLUE} />
            <path d="M6 6h8.5c2.76 0 5 2.24 5 5s-2.24 5-5 5H6V6Z" fill="#fff" />
            <path d="M14.5 16l6.5 6.5h-5l-3.5-6.5h2Z" fill="#fff" fillOpacity="0.55" />
          </svg>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 16, color: '#fff' }}>PipelineGPT</span>
          <span style={{ fontFamily: F, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>
            Two-factor authentication setup
          </span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#fff', border: '1px solid #d4d6d8' }}>

            {/* Header */}
            <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid #edeff0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <ShieldCheck size={20} color={BLUE} />
                <div style={{ width: 36, height: 3, background: YELLOW }} />
              </div>
              <h1 style={{ fontFamily: F, fontSize: '1.5rem', fontWeight: 700, color: DARK, marginBottom: 6, lineHeight: '110%' }}>
                Enrol authenticator app
              </h1>
              <p style={{ fontFamily: F, fontSize: '0.875rem', color: GRAY_500, lineHeight: '138%' }}>
                As an engineer, you must set up two-factor authentication before accessing the review queue. This cannot be skipped.
              </p>
            </div>

            <div style={{ padding: '24px 32px 28px' }}>

              {step === 'done' ? (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' }}>
                    <CheckCircle size={48} color="#1A7A4A" />
                    <div>
                      <p style={{ fontFamily: F, fontSize: '1.0625rem', fontWeight: 700, color: DARK, marginBottom: 4 }}>
                        Authenticator enrolled
                      </p>
                      <p style={{ fontFamily: F, fontSize: '0.875rem', color: GRAY_500, lineHeight: '138%' }}>
                        Your account is secured with TOTP. Please sign in again to continue.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                      display: 'block', width: '100%', padding: '13px 24px',
                      background: DARK, color: '#fff', border: `2px solid ${DARK}`,
                      fontFamily: F, fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Sign in to continue →
                  </button>
                </div>
              ) : step === 'qr' ? (
                <div>
                  {/* Step 1 */}
                  <div style={{ marginBottom: 24 }}>
                    <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GRAY_500, marginBottom: 10 }}>
                      Step 1 — Scan with your authenticator
                    </p>
                    <p style={{ fontFamily: F, fontSize: '0.875rem', color: '#55606e', marginBottom: 16, lineHeight: '138%' }}>
                      Open <strong>Google Authenticator</strong>, <strong>Authy</strong>, or any TOTP app, then scan this QR code.
                    </p>

                    {/* QR code */}
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: '#fafafa', border: '1px solid #edeff0', marginBottom: 16 }}>
                      {qrUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={qrUrl} alt="TOTP QR code" width={180} height={180} />
                      ) : (
                        <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 28, height: 28, border: '3px solid #d4d6d8', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                      )}
                    </div>

                    {/* Manual entry */}
                    <div style={{ background: '#edeff0', border: '1px solid #d4d6d8', padding: '12px 14px' }}>
                      <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: GRAY_500, marginBottom: 6 }}>
                        Or enter key manually
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <code style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, color: DARK, wordBreak: 'break-all' }}>
                          {secret || '— loading —'}
                        </code>
                        {secret && (
                          <button
                            onClick={copySecret}
                            title="Copy secret"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#1A7A4A' : BLUE, padding: 4 }}
                          >
                            {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: '#edeff0' }} />
                    <span style={{ fontFamily: F, fontSize: 11, color: GRAY_500, whiteSpace: 'nowrap' }}>
                      <Smartphone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      Issuer: PipelineGPT
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#edeff0' }} />
                  </div>

                  <button
                    onClick={() => setStep('verify')}
                    disabled={!uri}
                    style={{
                      display: 'block', width: '100%', padding: '13px 24px',
                      background: uri ? BLUE : '#d4d6d8', color: '#fff',
                      border: `2px solid ${uri ? BLUE : '#d4d6d8'}`,
                      fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                      cursor: uri ? 'pointer' : 'not-allowed',
                    }}
                  >
                    I've scanned it — continue →
                  </button>
                </div>
              ) : (
                /* Step 2: enter code */
                <form onSubmit={handleVerify}>
                  <p style={{ fontFamily: F, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GRAY_500, marginBottom: 10 }}>
                    Step 2 — Enter the 6-digit code
                  </p>
                  <p style={{ fontFamily: F, fontSize: '0.875rem', color: '#55606e', marginBottom: 20, lineHeight: '138%' }}>
                    Open your authenticator app and enter the code shown for PipelineGPT.
                  </p>

                  <div style={{ marginBottom: 20 }}>
                    <input
                      className="mfa-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9 ]{6,7}"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="000 000"
                      maxLength={7}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div style={{ padding: '12px 16px', background: '#fff5f5', border: '2px solid #ffbcb7', borderLeft: '4px solid #d12800', fontFamily: F, fontSize: '0.875rem', color: '#d12800', marginBottom: 20 }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { setStep('qr'); setError(null) }}
                      style={{
                        padding: '13px 20px', background: '#fff', color: '#55606e',
                        border: '2px solid #d4d6d8', fontFamily: F, fontSize: '0.875rem',
                        fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || code.replace(/\s/g, '').length < 6}
                      style={{
                        flex: 1, padding: '13px 24px',
                        background: loading ? '#1f5a95' : BLUE, color: '#fff',
                        border: `2px solid ${loading ? '#1f5a95' : BLUE}`,
                        fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {loading ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                          Verifying…
                        </span>
                      ) : 'Verify & complete setup'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
