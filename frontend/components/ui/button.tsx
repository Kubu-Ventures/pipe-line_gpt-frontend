import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005DAA] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-[#005DAA] text-white hover:bg-[#004A8F] rounded-[4px]',
        ghost: 'border border-[#C8D0DC] text-[#4A5568] bg-transparent hover:border-[#005DAA] hover:text-[#005DAA] rounded-[4px]',
        danger: 'bg-[#B91C1C] text-white hover:bg-[#991B1B] rounded-[4px]',
        success: 'bg-[#1A7A4A] text-white hover:bg-[#15653D] rounded-[4px]',
        link: 'text-[#005DAA] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-[0.9375rem]',
        lg: 'px-8 py-3 text-base',
        icon: 'p-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
)
Button.displayName = 'Button'
