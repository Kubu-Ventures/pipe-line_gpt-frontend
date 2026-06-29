import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { rtlLocales } from '@/i18n/routing'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://pipelinegpt.xyz'),

  title: {
    default: 'PipelineGPT — AI Pipeline Integrity Intelligence',
    template: '%s | PipelineGPT',
  },

  description:
    'PipelineGPT lets pipeline engineers query ILI reports, SCADA exports, and PHMSA incident records in plain English — with cited answers, multilingual support, and mandatory engineer review before any operational decision.',

  keywords: [
    'pipeline integrity AI',
    'ILI report analysis',
    'SCADA data intelligence',
    'PHMSA compliance',
    'pipeline natural language query',
    'AI pipeline assistant',
    'pipeline anomaly detection',
    'integrity management AI',
    'pipeline data RAG',
    'PipelineGPT',
  ],

  authors: [{ name: 'PipelineGPT' }],
  creator: 'PipelineGPT',
  publisher: 'PipelineGPT',
  applicationName: 'PipelineGPT',
  category: 'Pipeline Integrity Software',

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pipelinegpt.xyz',
    siteName: 'PipelineGPT',
    title: 'PipelineGPT — AI Pipeline Integrity Intelligence',
    description:
      'Query your ILI reports, SCADA exports, and PHMSA data in plain English. Cited answers. Multilingual. Engineer-reviewed. Built for pipeline integrity professionals.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PipelineGPT — AI-powered pipeline integrity intelligence platform',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PipelineGPT — AI Pipeline Integrity Intelligence',
    description:
      'Ask anything about your pipeline data — ILI, SCADA, PHMSA — in any language. AI answers with citations and mandatory engineer sign-off.',
    images: ['/og-image.png'],
    creator: '@PipelineGPT',
  },

  alternates: {
    canonical: 'https://pipelinegpt.xyz',
    languages: {
      'en-US': 'https://pipelinegpt.xyz',
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const isRTL = (rtlLocales as string[]).includes(locale)
  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
