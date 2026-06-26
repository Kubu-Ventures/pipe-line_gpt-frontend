import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-[#1C2E4A] bg-[#050D1A] px-3 py-1 text-sm text-[#E8EDF4] placeholder:text-[#4A5A72] transition-colors',
        'focus:outline-none focus:border-[#1D6FD9] focus:ring-1 focus:ring-[#1D6FD9]/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
