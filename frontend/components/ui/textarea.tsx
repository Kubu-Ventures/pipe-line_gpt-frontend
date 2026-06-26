import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-lg border border-[#1C2E4A] bg-[#050D1A] px-3 py-2 text-sm text-[#E8EDF4] placeholder:text-[#4A5A72] transition-colors resize-none',
        'focus:outline-none focus:border-[#1D6FD9] focus:ring-1 focus:ring-[#1D6FD9]/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
