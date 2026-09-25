import { pageMetadata } from '@/lib/metadata'

export const generateMetadata = pageMetadata('home')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
