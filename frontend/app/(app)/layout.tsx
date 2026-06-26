'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  MessageSquare,
  ClipboardCheck,
  BarChart3,
  Upload,
  Shield,
  Activity,
  Bell,
  LogOut,
  ChevronDown,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const navLinks = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/review', label: 'Review', icon: ClipboardCheck },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/ingest', label: 'Ingest', icon: Upload },
  { href: '/audit', label: 'Audit', icon: Shield },
]

const languages = ['EN', 'ES', 'PT', 'DE', 'FR']

const pageTitles: Record<string, string> = {
  '/chat': 'Pipeline Intelligence Chat',
  '/review': 'HITL Review Queue',
  '/dashboard': 'Analytics Dashboard',
  '/ingest': 'Data Ingestion Manager',
  '/audit': 'Audit Log',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [lang, setLang] = useState('EN')
  const [notifCount] = useState(3)

  const pageTitle = Object.entries(pageTitles).find(([k]) => pathname?.startsWith(k))?.[1] ?? 'PipelineGPT'
  const userEmail = session?.user?.email ?? 'operator@pipeline.com'
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#050D1A] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 flex flex-col bg-[#0A1628] border-r border-[#1C2E4A]">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[#1C2E4A] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1D6FD9]/20 border border-[#1D6FD9]/40 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#1D6FD9]" />
          </div>
          <span className="text-base font-medium tracking-tight">
            <span className="text-[#8B9BB4] font-normal">Pipeline</span>
            <span className="text-[#1D6FD9] font-bold">GPT</span>
          </span>
          {/* Pulse dot */}
          <span className="ml-auto relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D6FD9] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1D6FD9]" />
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname?.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative',
                  isActive
                    ? 'text-[#E8EDF4] bg-[rgba(29,111,217,0.15)]'
                    : 'text-[#8B9BB4] hover:text-[#E8EDF4] hover:bg-[#0F1E38]',
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1D6FD9] rounded-full" />
                )}
                <Icon className={cn('w-4 h-4', isActive ? 'text-[#1D6FD9]' : '')} />
                {label}
                {href === '/review' && (
                  <span className="ml-auto text-xs bg-[#DC2626] text-white rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-[#1C2E4A]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#0F1E38] transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#1D6FD9]/20 border border-[#1D6FD9]/40 flex items-center justify-center text-sm font-semibold text-[#1D6FD9] shrink-0">
                  {userInitial}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-[#E8EDF4] truncate">{userEmail}</p>
                  <span className="text-[10px] text-[#4AA8FF] font-mono">OPERATOR</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#4A5A72] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#1C2E4A] my-1" />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-[#DC2626]">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center px-6 border-b border-[#1C2E4A] bg-[#050D1A] gap-4">
          <h1 className="text-sm font-semibold text-[#E8EDF4] flex-1 tracking-tight">{pageTitle}</h1>

          <div className="flex items-center gap-2">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1C2E4A] text-xs text-[#8B9BB4] hover:border-[#2A4270] hover:text-[#E8EDF4] transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                  {lang}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLang(l)}>
                    {l}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg border border-[#1C2E4A] text-[#8B9BB4] hover:border-[#2A4270] hover:text-[#E8EDF4] transition-colors">
              <Bell className="w-4 h-4" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
