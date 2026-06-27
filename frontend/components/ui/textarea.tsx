import { cn } from '@/lib/utils'
import { type TextareaHTMLAttributes, forwardRef } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 rounded-[4px] border border-[#C8D0DC] bg-white text-[#1A1A2A] text-sm',
        'placeholder:text-[#8896A8] resize-none',
        'focus:outline-none focus:border-[#005DAA] focus:ring-1 focus:ring-[#005DAA]',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
