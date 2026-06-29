import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { rtlLocales } from '@/i18n/routing'
import './globals.css'

export const metadata: Metadata = {
  title: 'PipelineGPT — ROSEN Group',
  description: 'AI-powered natural language interface for pipeline integrity data. 2026 Hermann Rosen Award submission.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const isRTL = (rtlLocales as string[]).includes(locale)
  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  )
}
