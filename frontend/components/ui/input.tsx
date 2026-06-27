import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 rounded-[4px] border border-[#C8D0DC] bg-white text-[#1A1A2A] text-sm',
        'placeholder:text-[#8896A8]',
        'focus:outline-none focus:border-[#005DAA] focus:ring-1 focus:ring-[#005DAA]',
        'disabled:bg-[#F8F9FB] disabled:text-[#8896A8]',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
