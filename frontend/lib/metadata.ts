import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type MetaKey =
  | 'signIn'
  | 'home'
  | 'chat'
  | 'review'
  | 'dashboard'
  | 'ingest'
  | 'audit'
  | 'admin'
  | 'mfaSetup'
  | 'acceptInvite'

/**
 * generateMetadata for a route layout: the page title in the visitor's language.
 * Pages are client components and can't export metadata themselves; the root
 * layout's template turns "Review" into "Review | PipelineGPT".
 */
export function pageMetadata(key: MetaKey, extra?: (t: (k: string) => string) => Metadata) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'meta' })
    return { title: t(key), ...extra?.(t) }
  }
}
