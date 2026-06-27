'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { TopNav } from '@/components/TopNav'
import { Footer } from '@/components/Footer'
import { PageHero } from '@/components/PageHero'
import { UserPlus, RefreshCw, CheckCircle, Clock, AlertTriangle, X, ChevronDown } from 'lucide-react'

const F      = 'Inter, "Proxima Nova", ProximaNova, sans-serif'
const BLUE   = '#006eb5'
const DARK   = '#232e3e'
const YELLOW = '#ffeb00'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED'
type UserRole   = 'OPERATOR' | 'ENGINEER' | 'ADMIN'

interface UserRow {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  mfa_enabled: boolean
  created_at: string
  last_login: string | null
}

interface Invitation {
  id: string
  email: string
  role: UserRole
  token: string
  expires_at: string
  created_at: string
}

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  OPERATOR: { bg: '#dff0ff', color: BLUE },
  ENGINEER: { bg: '#FEF3C7', color: '#B45309' },
  ADMIN:    { bg: '#EDE9FE', color: '#5B21B6' },
}

const STATUS_BADGE: Record<UserStatus, { bg: string; color: string; border: string }> = {
  ACTIVE:    { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  PENDING:   { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  SUSPENDED: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
}

function Badge({ variant, children }: { variant: 'role' | 'status'; children: string }) {
  const cfg = variant === 'role'
    ? ROLE_BADGE[children as UserRole]  ?? { bg: '#edeff0', color: '#55606e' }
    : STATUS_BADGE[children as UserStatus] ?? { bg: '#edeff0', color: '#55606e', border: '#d4d6d8' }
  return (
    <span style={{
      fontFamily: F, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      background: cfg.bg, color: cfg.color,
      padding: '3px 8px',
      border: `1px solid ${'border' in cfg ? cfg.border : cfg.bg}`,
    }}>
      {children}
    </span>
  )
}

function timeAgo(iso: string | null) {
  if (!iso) return 'Never'
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function AdminPage() {
  const { data: session } = useSession()

  const [users,       setUsers]       = useState<UserRow[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [inviteOpen,  setInviteOpen]  = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState<UserRole>('OPERATOR')
  const [inviting,    setInviting]    = useState(false)
  const [inviteResult, setInviteResult] = useState<{ token: string; email: string } | null>(null)
  const [inviteError,  setInviteError]  = useState<string | null>(null)
  const [copyMsg,     setCopyMsg]     = useState(false)

  const headers = { Authorization: `Bearer ${session?.accessToken}` }

  const loadData = useCallback(async () => {
    if (!session?.accessToken) return
    setLoading(true)
    try {
      const [usersRes, invRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { headers }),
        fetch(`${API_URL}/admin/invitations`, { headers }),
      ])
      if (usersRes.ok) {
        const d = await usersRes.json()
        setUsers(d.users ?? d)
      }
      if (invRes.ok) {
        const d = await invRes.json()
        setInvitations(Array.isArray(d) ? d : d.items ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [session?.accessToken])

  useEffect(() => { loadData() }, [loadData])

  async function updateStatus(userId: string, status: UserStatus) {
    await fetch(`${API_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadData()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    try {
      const res = await fetch(`${API_URL}/admin/invite`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInviteError(data.detail ?? 'Could not create invitation.')
      } else {
        setInviteResult({ token: data.token, email: inviteEmail })
        setInviteEmail('')
        loadData()
      }
    } catch {
      setInviteError('Could not connect to the server.')
    } finally {
      setInviting(false)
    }
  }

  const inviteLink = inviteResult
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite/${inviteResult.token}`
    : ''

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopyMsg(true)
    setTimeout(() => setCopyMsg(false), 2000)
  }

  const activeCount    = users.filter(u => u.status === 'ACTIVE').length
  const pendingInvites = invitations.length
  const engineerCount  = users.filter(u => u.role === 'ENGINEER').length

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#edeff0', fontFamily: F }}>
      <TopNav activeTab="admin" />

      <PageHero
        title="User Management"
        subtitle="Manage who has access to PipelineGPT. Invite operators and engineers by email. Roles are assigned at invite time."
        compact
      />

      <main style={{ flex: 1 }}>
        <div className="page-content" style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Metric strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #d4d6d8', borderTop: `4px solid ${BLUE}`, background: '#fff', marginBottom: 24, overflow: 'hidden' }}>
            {[
              { value: activeCount,    label: 'Active Users',      sub: 'Currently with system access' },
              { value: engineerCount,  label: 'Engineers',          sub: 'With HITL review access' },
              { value: pendingInvites, label: 'Pending Invitations', sub: 'Awaiting acceptance' },
            ].map((m, i) => (
              <div key={m.label} style={{ padding: '20px 24px', borderRight: i < 2 ? '1px solid #d4d6d8' : 'none' }}>
                <div style={{ fontFamily: F, fontSize: 28, fontWeight: 700, color: DARK, marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: DARK, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div style={{ background: '#fff', border: '1px solid #d4d6d8', marginBottom: 16, overflow: 'hidden' }}>
            {/* Table header bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #d4d6d8', background: DARK }}>
              <div>
                <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#60d4f2', marginBottom: 4 }}>
                  Access Roster
                </p>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={loadData}
                  style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.70)', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => { setInviteOpen(true); setInviteResult(null); setInviteError(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 16px', background: YELLOW, color: DARK,
                    border: `2px solid ${YELLOW}`, fontFamily: F, fontSize: 12,
                    fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  <UserPlus size={14} /> Invite User
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#a9b1b7' }}>
                <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #d4d6d8', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 12 }} />
                <p style={{ fontFamily: F, fontSize: 14 }}>Loading users…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <p style={{ fontFamily: F, fontSize: 14, color: '#a9b1b7' }}>No users found. Invite someone to get started.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#edeff0', borderBottom: '1px solid #d4d6d8' }}>
                    {['Email', 'Role', 'Status', 'MFA', 'Joined', 'Last Login', 'Actions'].map(h => (
                      <th key={h} style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#a9b1b7', padding: '10px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? '1px solid #edeff0' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 13, fontWeight: 500, color: DARK }}>{user.email}</td>
                      <td style={{ padding: '12px 16px' }}><Badge variant="role">{user.role}</Badge></td>
                      <td style={{ padding: '12px 16px' }}><Badge variant="status">{user.status}</Badge></td>
                      <td style={{ padding: '12px 16px' }}>
                        {user.role === 'OPERATOR' ? (
                          <span style={{ fontFamily: F, fontSize: 11, color: '#a9b1b7' }}>N/A</span>
                        ) : user.mfa_enabled ? (
                          <CheckCircle size={14} color="#1A7A4A" />
                        ) : (
                          <Clock size={14} color="#D97706" />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>{timeAgo(user.created_at)}</td>
                      <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>{timeAgo(user.last_login)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() => updateStatus(user.id, 'SUSPENDED')}
                            style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: '#B91C1C', background: 'none', border: '1px solid #FCA5A5', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            Suspend
                          </button>
                        ) : user.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => updateStatus(user.id, 'ACTIVE')}
                            style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: '#065F46', background: 'none', border: '1px solid #A7F3D0', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            Reinstate
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #d4d6d8', borderTop: '4px solid #D97706', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #edeff0' }}>
                <p style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: DARK }}>
                  Pending invitations ({invitations.length})
                </p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#edeff0', borderBottom: '1px solid #d4d6d8' }}>
                    {['Email', 'Role', 'Sent', 'Expires', 'Link'].map(h => (
                      <th key={h} style={{ fontFamily: F, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#a9b1b7', padding: '10px 16px', textAlign: 'left' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv, i) => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite/${inv.token}`
                    return (
                      <tr key={inv.id} style={{ borderBottom: i < invitations.length - 1 ? '1px solid #edeff0' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 13, color: DARK }}>{inv.email}</td>
                        <td style={{ padding: '12px 16px' }}><Badge variant="role">{inv.role}</Badge></td>
                        <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>{timeAgo(inv.created_at)}</td>
                        <td style={{ padding: '12px 16px', fontFamily: F, fontSize: 12, color: '#a9b1b7' }}>{timeAgo(inv.expires_at)} left</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => { navigator.clipboard.writeText(link) }}
                            style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: BLUE, background: '#dff0ff', border: '1px solid #b8d4f0', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            Copy link
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Invite modal */}
      {inviteOpen && (
        <>
          <div onClick={() => setInviteOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(35,46,62,0.50)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: '100%', maxWidth: 440,
            background: '#fff', border: '1px solid #d4d6d8',
            zIndex: 201,
          }}>
            {/* Modal header */}
            <div style={{ background: DARK, padding: '20px 24px 16px', borderBottom: `3px solid ${YELLOW}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#60d4f2', marginBottom: 6 }}>
                  Access Control
                </p>
                <h2 style={{ fontFamily: F, fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>Invite a user</h2>
              </div>
              <button onClick={() => setInviteOpen(false)} style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.70)', padding: '6px 8px', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {inviteResult ? (
                <div>
                  <div style={{ padding: '14px 16px', background: '#D1FAE5', border: '1px solid #A7F3D0', borderLeft: '4px solid #1A7A4A', marginBottom: 20 }}>
                    <p style={{ fontFamily: F, fontSize: '0.875rem', fontWeight: 600, color: '#065F46', marginBottom: 2 }}>
                      Invitation created for {inviteResult.email}
                    </p>
                    <p style={{ fontFamily: F, fontSize: '0.8125rem', color: '#065F46' }}>
                      Share the link below. It expires in 48 hours.
                    </p>
                  </div>

                  {/* Invite link */}
                  <div style={{ background: '#edeff0', border: '1px solid #d4d6d8', padding: '12px 14px', marginBottom: 16 }}>
                    <p style={{ fontFamily: F, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#a9b1b7', marginBottom: 6 }}>
                      Invitation link
                    </p>
                    <code style={{ fontFamily: 'monospace', fontSize: 12, color: DARK, wordBreak: 'break-all', display: 'block', marginBottom: 10 }}>
                      {inviteLink}
                    </code>
                    <button
                      onClick={copyLink}
                      style={{ fontFamily: F, fontSize: 12, fontWeight: 600, color: copyMsg ? '#065F46' : BLUE, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {copyMsg ? '✓ Copied!' : 'Copy to clipboard'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setInviteResult(null); setInviteEmail('') }}
                      style={{ flex: 1, padding: '11px', background: '#fff', color: '#55606e', border: '2px solid #d4d6d8', fontFamily: F, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Invite another
                    </button>
                    <button
                      onClick={() => setInviteOpen(false)}
                      style={{ flex: 1, padding: '11px', background: DARK, color: '#fff', border: `2px solid ${DARK}`, fontFamily: F, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontFamily: F, fontSize: '0.875rem', fontWeight: 600, color: DARK, marginBottom: 8 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="engineer@organization.com"
                      required
                      style={{
                        display: 'block', width: '100%', padding: '11px 14px',
                        border: '2px solid #d4d6d8', fontFamily: F, fontSize: '0.9375rem',
                        color: DARK, background: '#fff', outline: 'none', boxSizing: 'border-box',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = BLUE)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#d4d6d8')}
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontFamily: F, fontSize: '0.875rem', fontWeight: 600, color: DARK, marginBottom: 8 }}>
                      Role
                    </label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as UserRole)}
                        style={{
                          display: 'block', width: '100%', padding: '11px 40px 11px 14px',
                          border: '2px solid #d4d6d8', fontFamily: F, fontSize: '0.9375rem',
                          color: DARK, background: '#fff', outline: 'none',
                          appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
                        }}
                      >
                        <option value="OPERATOR">Operator — can query pipeline data</option>
                        <option value="ENGINEER">Engineer — can also review AI responses</option>
                        <option value="ADMIN">Admin — full access including user management</option>
                      </select>
                      <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#a9b1b7', pointerEvents: 'none' }} />
                    </div>
                    {inviteRole === 'ENGINEER' && (
                      <p style={{ fontFamily: F, fontSize: '0.8125rem', color: '#D97706', marginTop: 6 }}>
                        Engineers must complete TOTP setup on first login.
                      </p>
                    )}
                  </div>

                  {inviteError && (
                    <div style={{ padding: '12px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderLeft: '4px solid #B91C1C', fontFamily: F, fontSize: '0.875rem', color: '#991B1B', marginBottom: 16 }}>
                      {inviteError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={inviting}
                    style={{
                      display: 'block', width: '100%', padding: '12px 24px',
                      background: inviting ? '#1f5a95' : BLUE, color: '#fff',
                      border: `2px solid ${inviting ? '#1f5a95' : BLUE}`,
                      fontFamily: F, fontSize: '0.9375rem', fontWeight: 600,
                      cursor: inviting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {inviting ? 'Sending…' : 'Send invitation'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  )
}
