import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login'],
        disallow: ['/home', '/dashboard', '/chat', '/ingest', '/audit', '/review', '/admin', '/mfa-setup', '/accept-invite'],
      },
    ],
    sitemap: 'https://pipelinegpt.xyz/sitemap.xml',
  }
}
