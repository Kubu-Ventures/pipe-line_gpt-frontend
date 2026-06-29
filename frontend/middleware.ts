import createIntlMiddleware from 'next-intl/middleware'
import { auth } from '@/lib/auth'
import { routing, locales } from '@/i18n/routing'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const handleI18n = createIntlMiddleware(routing)

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Strip locale prefix to extract the logical path
  const segments = pathname.split('/')
  const potentialLocale = segments[1] ?? ''
  const hasLocale = (locales as readonly string[]).includes(potentialLocale)
  const logicalPath = hasLocale
    ? '/' + segments.slice(2).join('/')
    : pathname

  // Public routes — no auth check
  const isPublic =
    logicalPath === '/' ||
    logicalPath === '' ||
    logicalPath === '/login' ||
    logicalPath.startsWith('/accept-invite')

  if (!isPublic && !req.auth) {
    const locale = hasLocale ? potentialLocale : 'en'
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
  }

  const role = (req.auth?.user as any)?.role as string | undefined
  const locale = hasLocale ? potentialLocale : 'en'

  if (!isPublic && logicalPath.startsWith('/review') && role !== 'ENGINEER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(`/${locale}/home`, req.url))
  }

  if (!isPublic && logicalPath.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(`/${locale}/home`, req.url))
  }

  return handleI18n(req as unknown as NextRequest)
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
