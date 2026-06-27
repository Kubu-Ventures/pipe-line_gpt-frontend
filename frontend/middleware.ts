import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const path = req.nextUrl.pathname

  // Public routes — no auth required
  if (path === '/') return NextResponse.next()
  if (path.startsWith('/accept-invite')) return NextResponse.next()

  // Unauthenticated → login
  if (!req.auth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const role = (req.auth.user as any)?.role as string | undefined

  // Engineer/Admin-only: review queue
  if (path.startsWith('/review') && role !== 'ENGINEER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/home', req.url))
  }

  // Admin-only: user management
  if (path.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/home', req.url))
  }
})

export const config = {
  matcher: ['/((?!login|accept-invite|_next/static|_next/image|favicon.ico|api/auth).*)'],
}
