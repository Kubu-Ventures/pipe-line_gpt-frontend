'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal
export const DialogClose = DialogPrimitive.Close

export function DialogOverlay({ className, ...props }: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-50 bg-[rgba(0,27,58,0.6)] backdrop-blur-sm', className)}
      {...props}
    />
  )
}

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'bg-white rounded-[6px] shadow-2xl border border-[#E4E8EF]',
          'w-full max-w-[800px] max-h-[90vh] overflow-y-auto',
          'focus:outline-none',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 p-1 rounded text-[#8896A8] hover:text-[#1A1A2A] hover:bg-[#F2F4F7] transition-colors">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-5 border-b border-[#E4E8EF]', className)}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Title className={cn('text-lg font-700 text-[#1A1A2A]', className)}>
      {children}
    </DialogPrimitive.Title>
  )
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-[#8896A8] mt-1', className)}>
      {children}
    </DialogPrimitive.Description>
  )
}
