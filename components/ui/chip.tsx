'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  dot?: string
}

export function Chip({ active, dot, className, children, ...props }: ChipProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold transition-all',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
        className,
      )}
    >
      {dot && (
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
      )}
      {children}
    </button>
  )
}
