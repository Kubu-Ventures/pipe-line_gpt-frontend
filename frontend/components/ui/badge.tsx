import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#1C2E4A] bg-[#0F1E38] text-[#8B9BB4]',
        primary: 'border-[#1D6FD9]/30 bg-[rgba(29,111,217,0.15)] text-[#4AA8FF]',
        high: 'border-[#DC2626]/30 bg-[rgba(220,38,38,0.10)] text-[#DC2626]',
        medium: 'border-[#D97706]/30 bg-[rgba(217,119,6,0.10)] text-[#D97706]',
        low: 'border-[#16A34A]/30 bg-[rgba(22,163,74,0.10)] text-[#16A34A]',
        success: 'border-[#16A34A]/30 bg-[rgba(22,163,74,0.10)] text-[#16A34A]',
        warning: 'border-[#D97706]/30 bg-[rgba(217,119,6,0.10)] text-[#D97706]',
        danger: 'border-[#DC2626]/30 bg-[rgba(220,38,38,0.10)] text-[#DC2626]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
