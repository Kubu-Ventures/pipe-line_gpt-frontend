import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to PipelineGPT — AI-powered pipeline integrity intelligence for ILI reports, SCADA data, and PHMSA compliance.',
  openGraph: {
    title: 'Sign In to PipelineGPT',
    description: 'Access your pipeline integrity intelligence platform.',
    url: 'https://pipelinegpt.xyz/login',
  },
  alternates: { canonical: 'https://pipelinegpt.xyz/login' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
