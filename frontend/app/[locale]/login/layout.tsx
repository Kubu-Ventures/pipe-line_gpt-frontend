import { pageMetadata } from '@/lib/metadata'

export const generateMetadata = pageMetadata('signIn', (t) => ({ description: t('signInDescription') }))

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
