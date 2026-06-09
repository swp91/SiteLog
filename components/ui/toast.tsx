'use client'

import { cn } from '@/lib/utils'

interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div
      className={cn(
        'fixed bottom-24 wide:bottom-6 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-2.5 bg-ink/90 text-white text-sm font-medium rounded-full shadow-md',
        'backdrop-blur-sm pointer-events-none',
        'animate-[fadeIn_.2s_ease]',
      )}
    >
      {message}
    </div>
  )
}
