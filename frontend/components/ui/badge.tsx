import { cn } from '@/lib/utils'

type BadgeVariant = 'high' | 'medium' | 'low' | 'blue' | 'teal' | 'gray' | 'success' | 'danger'

const variants: Record<BadgeVariant, string> = {
  high: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
  medium: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
  low: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
  blue: 'bg-[#dff0ff] text-[#006eb5] border border-[#C7DCF5]',
  teal: 'bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]',
  gray: 'bg-[#F2F4F7] text-[#4A5568] border border-[#E4E8EF]',
  success: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
  danger: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
}

export function Badge({
  variant = 'gray',
  children,
  className,
}: {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold tracking-wide uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
