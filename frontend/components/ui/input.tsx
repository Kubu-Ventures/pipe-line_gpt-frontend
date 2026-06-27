import { cn } from '@/lib/utils'
import { type InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-3 py-2 border border-[#d4d6d8] bg-white text-[#232e3e] text-sm',
        'placeholder:text-[#8896A8]',
        'focus:outline-none focus:border-[#006eb5] focus:ring-1 focus:ring-[#006eb5]',
        'disabled:bg-[#F8F9FB] disabled:text-[#8896A8]',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
