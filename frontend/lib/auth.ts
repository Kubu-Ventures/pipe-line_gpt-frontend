import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// Surfaced to the login page as `res.code` from signIn().
class MfaRequired extends CredentialsSignin { code = 'mfa_required' }
class MfaInvalid extends CredentialsSignin { code = 'mfa_invalid' }
class LockedOut extends CredentialsSignin { code = 'locked_out' }

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        totp:     { label: 'Authentication code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const totp = typeof credentials.totp === 'string' ? credentials.totp.trim() : ''
        try {
          // Step 1: exchange credentials (+ TOTP code for enrolled engineers/admins) for a token
          const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              ...(totp ? { totp_code: totp } : {}),
            }),
          })
          if (loginRes.status === 429) throw new LockedOut()
          if (loginRes.status === 401) {
            const body = await loginRes.json().catch(() => null)
            if (body?.detail?.code === 'mfa_required') throw new MfaRequired()
            if (body?.detail?.code === 'mfa_invalid') throw new MfaInvalid()
          }
          if (!loginRes.ok) return null
          const loginData = await loginRes.json()
          const { access_token, mfa_setup_required = false } = loginData

          // Step 2: fetch the user profile
          const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${access_token}` },
          })
          if (!meRes.ok) return null
          const me = await meRes.json()

          return {
            id:               me.id,
            email:            me.email,
            name:             me.email.split('@')[0],
            accessToken:      access_token,
            role:             me.role,
            mfaEnabled:       me.mfa_enabled ?? false,
            mfaSetupRequired: mfa_setup_required,
          }
        } catch (err) {
          if (err instanceof CredentialsSignin) throw err
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken      = user.accessToken
        token.role             = user.role
        token.mfaEnabled       = user.mfaEnabled
        token.mfaSetupRequired = user.mfaSetupRequired
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken            = token.accessToken as string
      session.user.role              = token.role as string
      session.user.mfaEnabled        = token.mfaEnabled as boolean
      session.user.mfaSetupRequired  = token.mfaSetupRequired as boolean
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 28800 },  // 8 hours
})
