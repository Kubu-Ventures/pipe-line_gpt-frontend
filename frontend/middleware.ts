export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/chat/:path*',
    '/review/:path*',
    '/dashboard/:path*',
    '/ingest/:path*',
    '/audit/:path*',
  ],
}
