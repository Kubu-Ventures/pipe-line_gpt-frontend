import { cn } from '@/lib/utils'
import { type LabelHTMLAttributes, forwardRef } from 'react'

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('block text-xs font-600 text-[#4A5568] mb-1 uppercase tracking-wide', className)}
      {...props}
    />
  )
)
Label.displayName = 'Label'
