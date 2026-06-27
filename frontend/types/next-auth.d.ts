import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: DefaultSession['user'] & {
      role: string
    }
  }

  interface User {
    accessToken: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    role: string
  }
}
