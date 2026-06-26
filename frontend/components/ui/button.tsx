import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D6FD9] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-[#1D6FD9] text-white hover:bg-[#1A5FC4]',
        ghost: 'border border-[#1C2E4A] text-[#8B9BB4] hover:border-[#2A4270] hover:text-[#E8EDF4] bg-transparent',
        danger: 'border border-[#DC2626]/40 text-[#DC2626] hover:bg-[rgba(220,38,38,0.10)] bg-transparent',
        success: 'bg-[#16A34A] text-white hover:bg-[#15803D]',
        outline: 'border border-[#1D6FD9]/50 text-[#1D6FD9] hover:bg-[rgba(29,111,217,0.10)] bg-transparent',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        default: 'px-4 py-2',
        lg: 'px-6 py-3 text-base',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export { Button, buttonVariants }
