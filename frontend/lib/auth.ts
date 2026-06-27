import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          // Step 1: exchange credentials for a token
          const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
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
        } catch {
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
      session.accessToken            = token.accessToken
      session.user.role              = token.role
      session.user.mfaEnabled        = token.mfaEnabled
      session.user.mfaSetupRequired  = token.mfaSetupRequired
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 3600 },
})
