import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: DefaultSession['user'] & {
      role: string
      mfaEnabled: boolean
      mfaSetupRequired: boolean
    }
  }

  interface User {
    accessToken: string
    role: string
    mfaEnabled: boolean
    mfaSetupRequired: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    role: string
    mfaEnabled: boolean
    mfaSetupRequired: boolean
  }
}
