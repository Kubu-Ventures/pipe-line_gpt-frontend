import { cn } from '@/lib/utils'
import { type TextareaHTMLAttributes, forwardRef } from 'react'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 border border-[#d4d6d8] bg-white text-[#232e3e] text-sm',
        'placeholder:text-[#8896A8] resize-none',
        'focus:outline-none focus:border-[#006eb5] focus:ring-1 focus:ring-[#006eb5]',
        'transition-colors',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
